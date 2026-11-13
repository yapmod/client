import { createSignal } from 'solid-js';
import { isRecord, normalizeManifest, normalizeRemoteSource, readString } from './manifest';
import type { ClientPlugin, PluginState, StoredPlugin } from './types';

const STORAGE_KEY = 'yapmod.plugins.v1';

/**
 * Reserved prefix for plugins registered by the application embedding
 * Yapmod. Local ids are slugified names and remote ids are host plus path,
 * so neither can produce a `client:` id.
 */
const CLIENT_PREFIX = 'client:';

const CLIENT_STORAGE_KEY = 'yapmod.client-plugins.v1';

const EMPTY_STATE: PluginState = {
  plugins: [],
};

function readStoredPlugin(value: unknown): StoredPlugin | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id)?.trim();
  const js = readString(value.js);
  if (!id || !js) return null;

  const local = value.local === true;
  const src = local ? undefined : normalizeRemoteSource(readString(value.src) ?? '');
  if (!local && !src) return null;

  return {
    id,
    local,
    on: value.on === true,
    update: value.update === true,
    src,
    js,
    manifest: normalizeManifest(value.manifest, {
      name: id,
      author: 'Unknown Author',
      description: 'A Yapin plugin.',
    }),
  };
}

/** Reads the persisted plugin list, dropping malformed records. */
function loadState(): PluginState {
  let parsed: unknown;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_STATE;
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.plugins)) return EMPTY_STATE;

  const plugins: StoredPlugin[] = [];
  const ids = new Set<string>();

  for (const value of parsed.plugins) {
    const plugin = readStoredPlugin(value);
    if (!plugin || ids.has(plugin.id)) continue;
    ids.add(plugin.id);
    plugins.push(plugin);
  }

  return { plugins };
}

function persist(state: PluginState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[yapmod] could not save plugins', error);
  }
}

const [state, setState] = createSignal<PluginState>(loadState());

function commit(next: PluginState): void {
  persist(next);
  setState(next);
}

/** The current plugin state. Reading it inside a Solid view makes it reactive. */
export function pluginState(): PluginState {
  return state();
}

/** Finds one installed plugin by its stable id. */
export function getPluginRecord(id: string): StoredPlugin | undefined {
  return state().plugins.find((plugin) => plugin.id === id);
}

/** Adds a record. Callers are responsible for choosing a unique id. */
export function addPluginRecord(plugin: StoredPlugin): void {
  commit({ plugins: [...state().plugins, plugin] });
}

/** Replaces a record in place, preserving its position in the list. */
export function replacePluginRecord(id: string, plugin: StoredPlugin): void {
  commit({
    plugins: state().plugins.map((candidate) => (candidate.id === id ? plugin : candidate)),
  });
}

/** Deletes a record. Plugin storage is intentionally kept for a reinstall. */
export function removePluginRecord(id: string): void {
  commit({ plugins: state().plugins.filter((plugin) => plugin.id !== id) });
}

/** Persists the enabled flag without starting or stopping the runtime. */
export function setPluginEnabledRecord(id: string, enabled: boolean): void {
  const plugin = getPluginRecord(id);
  if (!plugin || plugin.on === enabled) return;

  replacePluginRecord(id, { ...plugin, on: enabled });
}

/**
 * The persisted part of client-registered plugins: the user's explicit
 * enable/disable choices. The definitions themselves are never persisted —
 * they come from the host application on every page load.
 */
interface ClientPluginState {
  overrides: Record<string, boolean>;
}

function loadClientState(): ClientPluginState {
  let parsed: unknown;

  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (!raw) return { overrides: {} };
    parsed = JSON.parse(raw);
  } catch {
    return { overrides: {} };
  }

  if (!isRecord(parsed) || !isRecord(parsed.overrides)) return { overrides: {} };

  const overrides: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(parsed.overrides)) {
    if (id.startsWith(CLIENT_PREFIX) && typeof value === 'boolean') overrides[id] = value;
  }

  return { overrides };
}

function persistClientState(next: ClientPluginState): void {
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('[yapmod] could not save client plugin state', error);
  }
}

const [clientList, setClientList] = createSignal<ClientPlugin[]>([]);
const [clientState, setClientState] = createSignal<ClientPluginState>(loadClientState());

/** True for the reserved `client:` id namespace. */
export function isClientPluginId(id: string): boolean {
  return id.startsWith(CLIENT_PREFIX);
}

/**
 * Validates and records a definition handed over by the embedding
 * application. Malformed or duplicate definitions are rejected with a
 * `[yapmod]` log instead of throwing, so a bad call never breaks the page.
 */
export function addClientPlugin(definition: unknown): ClientPlugin | null {
  if (!isRecord(definition)) {
    console.warn('[yapmod] skipped a client plugin that is not an object');
    return null;
  }

  const id = readString(definition.id)?.trim() ?? '';
  if (!isClientPluginId(id) || id.length === CLIENT_PREFIX.length) {
    console.warn(`[yapmod] skipped client plugin with invalid id ${JSON.stringify(id)}`);
    return null;
  }

  if (clientList().some((plugin) => plugin.id === id)) {
    console.warn(`[yapmod] skipped duplicate client plugin ${id}`);
    return null;
  }

  if (!isRecord(definition.manifest) || !readString(definition.manifest.name)?.trim()) {
    console.warn(`[yapmod] skipped client plugin ${id} with an invalid manifest`);
    return null;
  }

  if (typeof definition.setup !== 'function') {
    console.warn(`[yapmod] skipped client plugin ${id} without a setup function`);
    return null;
  }

  const plugin: ClientPlugin = {
    id,
    manifest: normalizeManifest(definition.manifest),
    defaultEnabled:
      typeof definition.defaultEnabled === 'boolean' ? definition.defaultEnabled : undefined,
    setup: definition.setup as ClientPlugin['setup'],
  };

  setClientList((list) => [...list, plugin]);
  return plugin;
}

/** Every client-registered plugin, in registration order. */
export function clientPlugins(): ClientPlugin[] {
  return clientList();
}

/** Finds one client-registered plugin by its namespaced id. */
export function findClientPlugin(id: string): ClientPlugin | undefined {
  return clientList().find((plugin) => plugin.id === id);
}

/**
 * The state a client plugin should run in: the user's explicit choice,
 * else the host application's `defaultEnabled`, else enabled. A host can
 * therefore ship plugins on by default without overriding a choice the user
 * already made.
 */
export function clientPluginEnabled(id: string): boolean {
  const override = clientState().overrides[id];
  if (typeof override === 'boolean') return override;
  return findClientPlugin(id)?.defaultEnabled ?? true;
}

/** Persists an explicit enable/disable choice for a client plugin. */
export function setClientPluginEnabled(id: string, enabled: boolean): void {
  if (!isClientPluginId(id)) return;
  if (clientState().overrides[id] === enabled) return;

  const next: ClientPluginState = { overrides: { ...clientState().overrides, [id]: enabled } };
  persistClientState(next);
  setClientState(next);
}
