import type { Client } from '@yapmod/types';
import {
  Button,
  Divider,
  Hint,
  Icon,
  Input,
  Panel,
  Select,
  SettingsPage,
  SettingRow,
  SettingText,
  Section,
  Switch,
  Textarea,
  injectStyle,
  removeStyle,
} from '@yapmod/ui';
import { createSignal } from 'solid-js';
import { openContentModal, openModal } from '../../lib/modal';
import { sharedSolid } from '../../lib/solid';
import { showToast } from '../../lib/toast';
import { registerComposerTool } from './tools';
import { registerSettingsSection } from '../settings/install';
import { registerComposerBlock, registerComposerStatus } from './composer';
import { evaluatePluginSource } from './eval';
import { isRecord, localPluginId, normalizeManifest, remotePluginId } from './manifest';
import { observeElements } from './observe';
import { fetchRemotePlugin } from './remote';
import { PluginScope } from './scope';
import { registerCommand, validateCommand } from './commands';
import { registerMessageAction } from './menus';
import { createPluginStorage } from './storage';
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
  startup?: Promise<unknown>;
  devBuild?: StoredPlugin;
  onUnload?: PluginFunction;
  settings?: unknown;
  disposers: PluginScope;
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
// A reload temporarily owns two instances of the same plugin.
let styleCounter = 0;

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

function callHook(
  hook: PluginFunction | undefined,
  thisArg: unknown,
  label: string,
): Promise<unknown> | undefined {
  if (!hook) return;

  const result = hook.call(thisArg);
  if (result instanceof Promise) {
    result.catch((error: unknown) => console.error(`[yapmod] ${label} failed`, error));
    return result;
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
  disposers: PluginScope;
} {
  const { storage, persist } = createPluginStorage(id);
  const disposers = new PluginScope(loaded.has(id));
  const commandNames = new Set<string>();

  const api: YapmodPluginApi = {
    apiVersion: 1,
    id,
    manifest: { ...manifest },
    storage,
    flushStorage() {
      persist();
    },
    log(...args: unknown[]) {
      console.log(`[yapmod:${id}]`, ...args);
    },
    observe(selector, onFound) {
      return disposers.install(() => observeElements(selector, onFound));
    },
    commands: {
      register(command) {
        const validated = validateCommand(id, command);
        if (commandNames.has(validated.name))
          throw new Error(`/${validated.name} is already registered.`);
        commandNames.add(validated.name);
        try {
          const remove = disposers.installUi(() => registerCommand(id, validated));
          let active = true;
          return () => {
            if (!active) return;
            active = false;
            commandNames.delete(validated.name);
            remove();
          };
        } catch (error) {
          commandNames.delete(validated.name);
          throw error;
        }
      },
    },
    contextMenus: {
      registerAction(target, action) {
        if (target !== 'message') throw new TypeError('Unsupported context menu target.');
        return disposers.installUi(() => registerMessageAction(id, action));
      },
    },
    ui: {
      showToast: showToast,
      openModal(options) {
        return disposers.installUi(() => openModal(options));
      },
      injectCss(css) {
        return disposers.install(() => {
          const styleId = `yapmod-plugin-${id}-${styleCounter++}`;
          injectStyle(styleId, css);
          return () => removeStyle(styleId);
        });
      },
      Button,
      Hint,
      Panel,
      Icon,
      Switch,
      Input,
      Textarea,
      Select,
      SettingsPage,
      Section,
      SettingRow,
      SettingText,
      Divider,
    },
    composer: {
      registerBlock(render) {
        if (typeof render !== 'function')
          throw new TypeError('registerBlock expects a render function.');
        return disposers.installUi(() => registerComposerBlock(id, render));
      },
      registerStatus(format) {
        if (typeof format !== 'function')
          throw new TypeError('registerStatus expects a formatter.');
        return disposers.installUi(() => registerComposerStatus(id, format));
      },
      registerTool(tool) {
        return disposers.installUi(() => registerComposerTool(id, tool));
      },
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
        return disposers.installUi(() =>
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
      if (typeof dispose === 'function') disposers.onDispose(dispose);
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
  disposers: PluginScope,
): boolean {
  let record: LoadedPlugin;
  try {
    record = {
      module,
      api,
      onUnload: asFunction(module.onUnload),
      settings: module.settings,
      disposers,
    };

    disposers.publishUi();
  } catch (error) {
    disposers.dispose();
    console.error(`[yapmod] could not prepare plugin ${id}`, error);
    return false;
  }

  loaded.set(id, record);
  syncSettingsIds();

  try {
    record.startup = callHook(asFunction(module.onLoad), module, `plugin ${id} onLoad`);
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
    const result = evaluatePluginSource(plugin.js, api, `yapmod://${id}`);
    if (!isRecord(result)) throw new Error('Plugin code must return an object.');
    module = result;
  } catch (error) {
    disposers.dispose();
    console.error(`[yapmod] could not load plugin ${id}`, error);
    return false;
  }

  return activatePlugin(id, module, api, disposers);
}

/** Includes dev plugins whose first async startup has not been saved yet. */
export function runningPluginIds(): IterableIterator<string> {
  return loaded.keys();
}

/** The outcome of a hot reload. */
export interface ReloadResult {
  ok: boolean;
  message?: string;
}

/**
 * Replaces the code of a plugin while the page is running.
 *
 * The new source is evaluated *before* the old plugin is stopped, so a
 * broken build leaves the working version untouched. That ordering is what
 * makes hot reload safe: a save with a syntax error must not take the
 * plugin down.
 *
 * The plugin's storage survives, because it is keyed by the plugin id and
 * re-read from `localStorage` for the new instance.
 */
export async function reloadPlugin(next: StoredPlugin): Promise<ReloadResult> {
  if (runtimeDisposed) return { ok: false, message: 'Yapmod is shutting down.' };

  const { id, js: source, manifest } = next;
  const previous = getPluginRecord(id);
  const running = loaded.get(id);
  if (
    previous &&
    running?.devBuild === previous &&
    previous.js === source &&
    JSON.stringify(previous.manifest) === JSON.stringify(manifest)
  ) {
    return { ok: true, message: 'Already up to date.' };
  }

  const { api, disposers } = createPluginApi(id, manifest);

  let module: Record<string, unknown>;
  try {
    const result = evaluatePluginSource(source, api, `yapmod://${id}`);
    if (!isRecord(result)) throw new Error('Plugin code must return an object.');
    module = result;
  } catch (error) {
    disposers.dispose();
    console.error(`[yapmod] could not reload plugin ${id}`, error);
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }

  stopPlugin(id);

  const activated = activatePlugin(id, module, api, disposers);
  const candidate = loaded.get(id);
  try {
    if (!activated || !candidate) throw new Error('The plugin failed to start.');
    if (candidate.startup) await candidate.startup;
    // A newer build, a manual stop, or disposal can supersede a pending onLoad.
    if (loaded.get(id) !== candidate) return { ok: false, message: 'Reload superseded.' };

    if (previous) replacePluginRecord(id, next);
    else addPluginRecord(next);
    candidate.devBuild = next;
    return { ok: true };
  } catch (error) {
    if (candidate && loaded.get(id) !== candidate) {
      return { ok: false, message: 'Reload superseded.' };
    }
    if (candidate) stopPlugin(id);
    // The previous source and manifest are still in the store. Restart its
    // normal lifecycle so resources released by onUnload are acquired again.
    if (running && previous && !startPlugin(id)) {
      return { ok: false, message: 'Reload failed and the previous plugin could not restart.' };
    }
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Starts one client-registered plugin.
 *
 * The definition's `setup` runs as ordinary trusted code, synchronously,
 * in the host application's own module. Its module goes through
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
    disposers.dispose();
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

  plugin.disposers.dispose();

  loaded.delete(id);
  syncSettingsIds();
}

/**
 * Enables or disables a plugin, persisting the choice. Returns the state the
 * switch should show; a plugin that fails to load stays disabled.
 *
 * Client-registered plugins persist to their override store instead of a
 * plugin record. They have no record to write to, and can never be
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
 * Saves an edit before restarting the plugin. A failed fetch or storage
 * write leaves the working instance and its saved source intact.
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

  replacePluginRecord(id, next);
  stopPlugin(id);

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

  const next: StoredPlugin = {
    ...existing,
    src: remote.src,
    js: remote.js,
    manifest: remote.manifest,
  };
  replacePluginRecord(id, next);
  stopPlugin(id);

  if (wasRunning && !startPlugin(id)) {
    setPluginEnabledRecord(id, false);
  }

  return 'updated';
}

/** Deletes a plugin and stops it once the removal has been saved. */
export function removePlugin(id: string): void {
  removePluginRecord(id);
  stopPlugin(id);
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
 * they are never fetched or updated. Disposal stops every plugin, community
 * and client-registered alike, runs its cleanups, and removes any plugin
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
