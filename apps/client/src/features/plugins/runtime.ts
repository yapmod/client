import type { Client } from '@yapmod/types';
import { createSignal } from 'solid-js';
import { openContentModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import {
  builtinPlugins,
  builtinPluginEnabled,
  findBuiltinPlugin,
  isBuiltinPluginId,
  registerGlobalBuiltinPlugins,
  setBuiltinPluginEnabled,
} from './builtins';
import { evaluatePluginSource } from './eval';
import { isRecord, localPluginId, normalizeManifest, remotePluginId } from './manifest';
import { fetchRemotePlugin } from './remote';
import { loadPluginStorage, savePluginStorage } from './storage';
import {
  addPluginRecord,
  getPluginRecord,
  pluginState,
  removePluginRecord,
  replacePluginRecord,
  setPluginEnabledRecord,
} from './store';
import type { PluginFunction, PluginManifest, StoredPlugin, YapmodPluginApi } from './types';

interface LoadedPlugin {
  module: Record<string, unknown>;
  api: YapmodPluginApi;
  onUnload?: PluginFunction;
  settings?: unknown;
  disposers: (() => void)[];
  settingsModalClose?: () => void;
}

export interface LocalPluginInput {
  name: string;
  author: string;
  description: string;
  code: string;
}

export interface EditPluginInput {
  local: boolean;
  name: string;
  author: string;
  description: string;
  code: string;
  src: string;
  update: boolean;
}

const loaded = new Map<string, LoadedPlugin>();
const [settingsIds, setSettingsIds] = createSignal<string[]>([]);
let runtimeDisposed = false;

function syncSettingsIds(): void {
  const ids: string[] = [];

  for (const [id, plugin] of loaded) {
    if (plugin.settings !== undefined && plugin.settings !== null) ids.push(id);
  }

  setSettingsIds(ids);
}

function asFunction(value: unknown): PluginFunction | undefined {
  return typeof value === 'function' ? (value as PluginFunction) : undefined;
}

function callHook(hook: PluginFunction | undefined, thisArg: unknown, label: string): void {
  if (!hook) return;

  const result = hook.call(thisArg);
  if (result instanceof Promise) {
    result.catch((error: unknown) => console.error(`[yapmod] ${label} failed`, error));
  }
}

function runDisposers(plugin: LoadedPlugin): void {
  const disposers = plugin.disposers.splice(0);

  for (let index = disposers.length - 1; index >= 0; index -= 1) {
    const dispose = disposers[index];
    if (!dispose) continue;

    try {
      dispose();
    } catch (error) {
      console.error('[yapmod] plugin cleanup failed', error);
    }
  }
}

/**
 * Builds the API object every plugin receives. Community and built-in
 * plugins share it verbatim, so storage, cleanup registration and settings
 * behave identically for both.
 */
function createPluginApi(
  id: string,
  manifest: PluginManifest,
): {
  api: YapmodPluginApi;
  disposers: (() => void)[];
} {
  const storage = loadPluginStorage(id);
  const disposers: (() => void)[] = [];

  const api: YapmodPluginApi = {
    id,
    manifest: { ...manifest },
    storage,
    flushStorage() {
      savePluginStorage(id, storage);
    },
    onDispose(dispose) {
      if (typeof dispose === 'function') disposers.push(dispose);
    },
    showSettings() {
      showPluginSettings(id);
    },
  };

  return { api, disposers };
}

/**
 * Puts a module into the running map and calls its `onLoad`. A module whose
 * `onLoad` throws is stopped again and reported as failed, so callers can
 * persist the plugin as disabled.
 */
function activatePlugin(
  id: string,
  module: Record<string, unknown>,
  api: YapmodPluginApi,
  disposers: (() => void)[],
): boolean {
  const record: LoadedPlugin = {
    module,
    api,
    onUnload: asFunction(module.onUnload),
    settings: module.settings,
    disposers,
  };

  loaded.set(id, record);
  syncSettingsIds();

  try {
    callHook(asFunction(module.onLoad), module, `plugin ${id} onLoad`);
  } catch (error) {
    console.error(`[yapmod] plugin ${id} onLoad failed`, error);
    stopPlugin(id);
    return false;
  }

  return true;
}

/**
 * Evaluates and starts one installed plugin.
 *
 * Plugin source is an expression that returns an object with optional
 * `onLoad`, `onUnload` and `settings` members. The expression is evaluated in
 * the page's realm because plugins are trusted code.
 */
export function startPlugin(id: string): boolean {
  if (runtimeDisposed) return false;
  if (loaded.has(id)) return true;

  const plugin = getPluginRecord(id);
  if (!plugin) return false;

  const { api, disposers } = createPluginApi(id, plugin.manifest);

  let module: Record<string, unknown>;
  try {
    const result = evaluatePluginSource(plugin.js, api);
    if (!isRecord(result)) throw new Error('Plugin code must return an object.');
    module = result;
  } catch (error) {
    console.error(`[yapmod] could not load plugin ${id}`, error);
    return false;
  }

  return activatePlugin(id, module, api, disposers);
}

/**
 * Starts one registered built-in plugin.
 *
 * The definition's `setup` runs as ordinary trusted code — synchronously and
 * without any script evaluation — and its module goes through exactly the
 * same activation path as a community plugin.
 */
export function startBuiltinPlugin(id: string): boolean {
  if (runtimeDisposed) return false;
  if (loaded.has(id)) return true;

  const definition = findBuiltinPlugin(id);
  if (!definition) return false;

  const { api, disposers } = createPluginApi(id, definition.manifest);

  let module: Record<string, unknown>;
  try {
    const result = definition.setup(api);
    if (!isRecord(result)) throw new Error('Built-in plugin setup must return an object.');
    module = result;
  } catch (error) {
    console.error(`[yapmod] could not load built-in plugin ${id}`, error);
    return false;
  }

  return activatePlugin(id, module, api, disposers);
}

/** Stops one running plugin without changing its persisted enabled flag. */
export function stopPlugin(id: string): void {
  const plugin = loaded.get(id);
  if (!plugin) return;

  plugin.settingsModalClose?.();

  try {
    callHook(plugin.onUnload, plugin.module, `plugin ${id} onUnload`);
  } catch (error) {
    console.error(`[yapmod] plugin ${id} onUnload failed`, error);
  }

  runDisposers(plugin);

  loaded.delete(id);
  syncSettingsIds();
}

/**
 * Enables or disables a plugin, persisting the choice. Returns the state the
 * switch should show; a plugin that fails to load stays disabled.
 *
 * Built-ins persist to the built-in override store instead of the plugin
 * record — they have no record to write to, and can never be removed.
 */
export function setPluginEnabled(id: string, enabled: boolean): boolean {
  if (isBuiltinPluginId(id)) {
    if (enabled) {
      const started = startBuiltinPlugin(id);
      setBuiltinPluginEnabled(id, started);

      if (!started) {
        showToast(`Could not start ${findBuiltinPlugin(id)?.manifest.name ?? 'plugin'}.`, 'error');
      }

      return started;
    }

    stopPlugin(id);
    setBuiltinPluginEnabled(id, false);
    return false;
  }

  if (enabled) {
    const started = startPlugin(id);
    setPluginEnabledRecord(id, started);

    if (!started) {
      showToast(`Could not start ${getPluginRecord(id)?.manifest.name ?? 'plugin'}.`, 'error');
    }

    return started;
  }

  stopPlugin(id);
  setPluginEnabledRecord(id, false);
  return false;
}

/** Installs a local plugin from pasted or uploaded code. */
export function addLocalPlugin(input: LocalPluginInput): StoredPlugin {
  if (!input.name.trim()) throw new Error('Name is required.');
  if (!input.author.trim()) throw new Error('Author is required.');
  if (!input.code.trim()) throw new Error('Code is required.');

  const ids = new Set(pluginState().plugins.map((plugin) => plugin.id));
  const id = localPluginId(input.name, ids);

  const plugin: StoredPlugin = {
    id,
    local: true,
    on: false,
    update: false,
    js: input.code,
    manifest: normalizeManifest({
      name: input.name,
      author: input.author,
      description: input.description,
    }),
  };

  addPluginRecord(plugin);
  return plugin;
}

/** Fetches and installs a remote plugin from a folder URL. */
export async function addRemotePlugin(rawSource: string, update: boolean): Promise<StoredPlugin> {
  const remote = await fetchRemotePlugin(rawSource);
  const id = remotePluginId(remote.src);

  if (getPluginRecord(id)) throw new Error('That plugin is already installed.');

  const plugin: StoredPlugin = {
    id,
    local: false,
    on: false,
    update,
    src: remote.src,
    js: remote.js,
    manifest: remote.manifest,
  };

  addPluginRecord(plugin);
  return plugin;
}

/**
 * Saves an edit. Remote plugins are fetched before the running copy is
 * stopped, so a failed fetch leaves the old working plugin untouched.
 */
export async function editPlugin(id: string, input: EditPluginInput): Promise<StoredPlugin> {
  const existing = getPluginRecord(id);
  if (!existing) throw new Error('Plugin not found.');

  const wasOn = existing.on;
  let next: StoredPlugin;

  if (input.local) {
    if (!input.name.trim()) throw new Error('Name is required.');
    if (!input.author.trim()) throw new Error('Author is required.');
    if (!input.code.trim()) throw new Error('Code is required.');

    next = {
      id,
      local: true,
      on: wasOn,
      update: false,
      js: input.code,
      manifest: normalizeManifest({
        name: input.name,
        author: input.author,
        description: input.description,
      }),
    };
  } else {
    const remote = await fetchRemotePlugin(input.src);
    next = {
      id,
      local: false,
      on: wasOn,
      update: input.update,
      src: remote.src,
      js: remote.js,
      manifest: remote.manifest,
    };
  }

  stopPlugin(id);
  replacePluginRecord(id, next);

  if (wasOn && !startPlugin(id)) {
    setPluginEnabledRecord(id, false);
  }

  return getPluginRecord(id) ?? next;
}

/** Refreshes a remote plugin from its source folder. */
export async function updatePlugin(id: string): Promise<'updated' | 'current'> {
  const existing = getPluginRecord(id);
  if (!existing) throw new Error('Plugin not found.');
  if (existing.local) throw new Error('Local plugins cannot be updated.');
  if (!existing.src) throw new Error('Plugin has no source URL.');

  const remote = await fetchRemotePlugin(existing.src);
  const changed =
    remote.js !== existing.js ||
    JSON.stringify(remote.manifest) !== JSON.stringify(existing.manifest);

  if (!changed) return 'current';

  const wasRunning = loaded.has(id);
  stopPlugin(id);

  const next: StoredPlugin = {
    ...existing,
    src: remote.src,
    js: remote.js,
    manifest: remote.manifest,
  };
  replacePluginRecord(id, next);

  if (wasRunning && !startPlugin(id)) {
    setPluginEnabledRecord(id, false);
  }

  return 'updated';
}

/** Deletes a plugin, stopping it first if it is running. */
export function removePlugin(id: string): void {
  stopPlugin(id);
  removePluginRecord(id);
}

/** True when a running plugin exported a settings view. */
export function hasPluginSettings(id: string): boolean {
  return settingsIds().includes(id);
}

/**
 * Opens a running plugin's settings. `settings` may be a DOM node, a string
 * of HTML, or a function returning either. Async functions are supported so
 * plugins can lazily build their view.
 */
export function showPluginSettings(id: string): void {
  const plugin = loaded.get(id);
  if (!plugin || plugin.settings === undefined || plugin.settings === null) return;

  void (async () => {
    try {
      const settings = plugin.settings;
      let content =
        typeof settings === 'function'
          ? (settings as (...args: unknown[]) => unknown).call(plugin.module, plugin.api)
          : settings;

      if (content instanceof Promise) content = await content;
      if (loaded.get(id) !== plugin) return;

      plugin.settingsModalClose = openContentModal({
        title: `${plugin.api.manifest.name} Settings`,
        content: content instanceof Node || typeof content === 'string' ? content : undefined,
        wide: true,
      });
    } catch (error) {
      console.error(`[yapmod] could not open settings for ${id}`, error);
      showToast('Could not open plugin settings.', 'error');
    }
  })();
}

async function updateInstalledPlugins(): Promise<void> {
  const plugins = pluginState().plugins.filter((plugin) => !plugin.local && plugin.update);

  await Promise.allSettled(
    plugins.map(async (plugin) => {
      try {
        await updatePlugin(plugin.id);
      } catch (error) {
        console.error(`[yapmod] could not update plugin ${plugin.id}`, error);
      }
    }),
  );
}

/**
 * Installs the plugin runtime for the lifetime of the client.
 *
 * Definitions handed over by a custom loader are registered first. Remote
 * plugins with auto-update enabled are then refreshed, every stored plugin
 * marked as enabled is started, and finally every enabled built-in runs its
 * `setup`. Built-ins are excluded from the update path: their code ships
 * with the bundle and is never fetched. A built-in that fails to start is
 * logged and persisted as disabled so the next load does not retry it.
 * Disposal stops every plugin, runs its cleanups, and removes any plugin
 * modal without changing the saved enabled flags, so plugins start again the
 * next time Yapmod loads.
 */
export function installPlugins(client: Client): void {
  runtimeDisposed = false;
  registerGlobalBuiltinPlugins();

  client.onDispose(() => {
    runtimeDisposed = true;

    for (const id of loaded.keys()) {
      try {
        stopPlugin(id);
      } catch (error) {
        console.error(`[yapmod] could not stop plugin ${id}`, error);
      }
    }
  });

  void (async () => {
    await updateInstalledPlugins();
    if (runtimeDisposed) return;

    for (const plugin of pluginState().plugins) {
      if (!plugin.on) continue;
      if (!startPlugin(plugin.id)) setPluginEnabledRecord(plugin.id, false);
    }

    if (runtimeDisposed) return;

    for (const definition of builtinPlugins()) {
      if (!builtinPluginEnabled(definition.id)) continue;
      if (!startBuiltinPlugin(definition.id)) setBuiltinPluginEnabled(definition.id, false);
    }
  })();
}
