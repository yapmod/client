import { createSignal } from 'solid-js';
import { isRecord, normalizeManifest, readString } from './manifest';
import type { BuiltinPlugin } from './types';

/** Reserved prefix that keeps built-in ids out of the stored-plugin id space. */
const BUILTIN_PREFIX = 'builtin:';

const STORAGE_KEY = 'yapmod.builtin-plugins.v1';

/**
 * Definitions a custom loader can hand to Yapmod before the bundle runs.
 *
 * The bundle bootstraps at import time, so a loader must set this global
 * before injecting `yapmod-client.js`. It is an array of trusted
 * definitions, never source strings: nothing here is evaluated.
 */
declare global {
  var YapmodBuiltinPlugins: BuiltinPlugin[] | undefined;
}

interface BuiltinState {
  /** Explicit user choices, keyed by the namespaced id. */
  overrides: Record<string, boolean>;
}

const EMPTY_STATE: BuiltinState = { overrides: {} };

function loadState(): BuiltinState {
  let parsed: unknown;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_STATE;
  }

  if (!isRecord(parsed) || !isRecord(parsed.overrides)) return EMPTY_STATE;

  const overrides: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(parsed.overrides)) {
    if (id.startsWith(BUILTIN_PREFIX) && typeof value === 'boolean') overrides[id] = value;
  }

  return { overrides };
}

function persist(state: BuiltinState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[yapmod] could not save built-in plugin state', error);
  }
}

const registry = new Map<string, BuiltinPlugin>();
const [state, setState] = createSignal<BuiltinState>(loadState());

function commit(next: BuiltinState): void {
  persist(next);
  setState(next);
}

/** True for the reserved `builtin:` id namespace. */
export function isBuiltinPluginId(id: string): boolean {
  return id.startsWith(BUILTIN_PREFIX);
}

/**
 * Adds a built-in definition to the registry.
 *
 * Malformed or duplicate definitions are rejected with a `[yapmod]` log
 * instead of throwing: a bad loader entry must never break the bundle.
 */
export function registerBuiltinPlugin(definition: unknown): void {
  if (!isRecord(definition)) {
    console.warn('[yapmod] skipped a built-in plugin that is not an object');
    return;
  }

  const id = readString(definition.id)?.trim() ?? '';
  if (!isBuiltinPluginId(id) || id.length === BUILTIN_PREFIX.length) {
    console.warn(`[yapmod] skipped built-in plugin with invalid id ${JSON.stringify(id)}`);
    return;
  }

  if (registry.has(id)) {
    console.warn(`[yapmod] skipped duplicate built-in plugin ${id}`);
    return;
  }

  if (!isRecord(definition.manifest) || !readString(definition.manifest.name)?.trim()) {
    console.warn(`[yapmod] skipped built-in plugin ${id} with an invalid manifest`);
    return;
  }

  if (typeof definition.setup !== 'function') {
    console.warn(`[yapmod] skipped built-in plugin ${id} without a setup function`);
    return;
  }

  registry.set(id, {
    id,
    manifest: normalizeManifest(definition.manifest),
    defaultEnabled:
      typeof definition.defaultEnabled === 'boolean' ? definition.defaultEnabled : undefined,
    setup: definition.setup as BuiltinPlugin['setup'],
  });
}

/**
 * Registers every definition a custom loader left on
 * `globalThis.YapmodBuiltinPlugins`.
 *
 * The global is read on every install and left in place: after a
 * `dispose()` a fresh injection rebuilds an empty registry and must be able
 * to pick the definitions up again. Duplicates are rejected by
 * `registerBuiltinPlugin`, so reading it twice never doubles a built-in.
 */
export function registerGlobalBuiltinPlugins(): void {
  const pending = globalThis.YapmodBuiltinPlugins;
  if (!pending) return;

  if (!Array.isArray(pending)) {
    console.warn('[yapmod] YapmodBuiltinPlugins must be an array of definitions');
    return;
  }

  for (const definition of pending) registerBuiltinPlugin(definition);
}

/** Every registered built-in, in registration order. */
export function builtinPlugins(): BuiltinPlugin[] {
  return [...registry.values()];
}

/** Finds one registered built-in by its namespaced id. */
export function findBuiltinPlugin(id: string): BuiltinPlugin | undefined {
  return registry.get(id);
}

/**
 * The state a built-in should run in: the user's explicit choice, else the
 * definition's `defaultEnabled`, else enabled. New built-ins can therefore
 * ship enabled without overriding what the user already decided.
 */
export function builtinPluginEnabled(id: string): boolean {
  const override = state().overrides[id];
  if (typeof override === 'boolean') return override;
  return registry.get(id)?.defaultEnabled ?? true;
}

/** Persists an explicit enable/disable choice for a built-in. */
export function setBuiltinPluginEnabled(id: string, enabled: boolean): void {
  if (!isBuiltinPluginId(id)) return;
  if (state().overrides[id] === enabled) return;

  commit({ overrides: { ...state().overrides, [id]: enabled } });
}
