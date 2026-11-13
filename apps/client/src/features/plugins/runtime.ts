import type { Client } from '@yapmod/types';
import { Button, Hint, Icon, Panel, injectStyle, removeStyle } from '@yapmod/ui';
import { createSignal } from 'solid-js';
import { openContentModal, openModal } from '../../lib/modal';
import { sharedSolid } from '../../lib/solid';
import { showToast } from '../../lib/toast';
import { registerSettingsSection } from '../settings/install';
import { evaluatePluginSource } from './eval';
import { isRecord, localPluginId, normalizeManifest, remotePluginId } from './manifest';
import { observeElements } from './observe';
import { fetchRemotePlugin } from './remote';
import { loadPluginStorage, savePluginStorage } from './storage';
import {
  addClientPlugin,
  addPluginRecord,
  clientPluginEnabled,
  findClientPlugin,
  getPluginRecord,
  isClientPluginId,
  pluginState,
  removePluginRecord,
  replacePluginRecord,
  setClientPluginEnabled,
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
 * Builds the API object every plugin receives. Community and client-registered
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
  let styleCounter = 0;

  /**
   * Registers a disposer with the plugin and hands it back unchanged, so
   * every disposer-returning API call cleans up by default while still
   * letting the caller close or remove the thing early.
   */
  function track<T extends () => void>(dispose: T): T {
    disposers.push(dispose);
    return dispose;
  }

  const api: YapmodPluginApi = {
    apiVersion: 1,
    id,
    manifest: { ...manifest },
    storage,
    flushStorage() {
      savePluginStorage(id, storage);
    },
    log(...args: unknown[]) {
      console.log(`[yapmod:${id}]`, ...args);
    },
    observe(selector, onFound) {
      return track(observeElements(selector, onFound));
    },
    ui: {
      showToast: showToast,
      openModal(options) {
        return track(openModal(options));
      },
      injectCss(css) {
        const styleId = `yapmod-plugin-${id}-${styleCounter++}`;
        injectStyle(styleId, css);
        return track(() => removeStyle(styleId));
      },
      Button,
      Hint,
      Panel,
      Icon,
    },
    settings: {
      registerSection(section) {
        if (typeof section.label !== 'string' || !section.label.trim()) {
          throw new Error('registerSection(): section.label must be a non-empty string.');
        }
        if (typeof section.render !== 'function') {
          throw new Error('registerSection(): section.render must be a function.');
        }

        // Namespaced per plugin, so two plugins can use the same section id
        // and a plugin can never shadow Yapmod's own entries.
        return track(
          registerSettingsSection({
            id: `plugin:${id}:${section.id}`,
            label: section.label,
            icon: section.icon,
            render: section.render,
          }),
        );
      },
    },
    onDispose(dispose) {
      if (typeof dispose === 'function') disposers.push(dispose);
    },
    showSettings() {
      showPluginSettings(id);
    },
    solid: sharedSolid.solid,
    solidWeb: sharedSolid.solidWeb,
    solidStore: sharedSolid.solidStore,
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
 * Starts one client-registered plugin.
 *
 * The definition's `setup` runs as ordinary trusted code — synchronously,
 * in the host application's own module — and its module goes through
 * exactly the same activation path as a community plugin.
 */
export function startClientPlugin(id: string): boolean {
  if (runtimeDisposed) return false;
  if (loaded.has(id)) return true;

  const definition = findClientPlugin(id);
  if (!definition) return false;

  const { api, disposers } = createPluginApi(id, definition.manifest);

  let module: Record<string, unknown>;
  try {
    const result = definition.setup(api);
    if (!isRecord(result)) throw new Error('Client plugin setup must return an object.');
    module = result;
  } catch (error) {
    console.error(`[yapmod] could not load client plugin ${id}`, error);
    return false;
  }

  return activatePlugin(id, module, api, disposers);
}

/**
 * Registers a plugin provided by the application embedding Yapmod.
 *
 * This is the public entry point on `globalThis.YapmodClient`. The
 * definition is validated and recorded, then started immediately when it is
 * enabled (the host's `defaultEnabled`, unless the user chose otherwise).
 * A plugin that fails to start is logged and persisted as disabled, so the
 * next page load does not retry it silently.
 *
 * Returns `false` when the definition was rejected; a registered plugin
 * that failed to start still counts as registered.
 */
export function registerClientPlugin(definition: unknown): boolean {
  const plugin = addClientPlugin(definition);
  if (!plugin) return false;

  if (clientPluginEnabled(plugin.id) && !startClientPlugin(plugin.id)) {
    setClientPluginEnabled(plugin.id, false);
  }

  return true;
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
 * Client-registered plugins persist to their override store instead of a
 * plugin record — they have no record to write to, and can never be
 * removed or updated.
 */
export function setPluginEnabled(id: string, enabled: boolean): boolean {
  if (isClientPluginId(id)) {
    if (enabled) {
      const started = startClientPlugin(id);
      setClientPluginEnabled(id, started);

      if (!started) {
        showToast(`Could not start ${findClientPlugin(id)?.manifest.name ?? 'plugin'}.`, 'error');
      }

      return started;
    }

    stopPlugin(id);
    setClientPluginEnabled(id, false);
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
 * Remote plugins with auto-update enabled are refreshed first, then every
 * stored plugin marked as enabled is started. Client-registered plugins are
 * not started here: the embedding application registers them through
 * `registerClientPlugin()`, which starts them at registration time, and
 * they are never fetched or updated. Disposal stops every plugin — community
 * and client-registered alike — runs its cleanups, and removes any plugin
 * modal without changing the saved enabled flags, so plugins start again the
 * next time Yapmod loads.
 */
export function installPlugins(client: Client): void {
  runtimeDisposed = false;

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
  })();
}
