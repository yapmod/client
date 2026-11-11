import { createSignal } from 'solid-js';
import { isRecord, normalizeManifest, normalizeRemoteSource, readString } from './manifest';
import type { PluginState, StoredPlugin } from './types';

const STORAGE_KEY = 'yapmod.plugins.v1';

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
