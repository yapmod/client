import { createSignal } from 'solid-js';

const STORAGE_KEY = 'yapmod.plugins.data.v1';

type PluginData = Record<string, Record<string, unknown>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readData(): PluginData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const data: PluginData = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (isRecord(value)) data[id] = value;
    }
    return data;
  } catch (error) {
    console.error('[yapmod] could not read plugin storage', error);
    return {};
  }
}

function writeData(data: PluginData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[yapmod] could not save plugin storage', error);
  }
}

/** Loads one plugin's persisted data object. */
function loadPluginStorage(id: string): Record<string, unknown> {
  return readData()[id] ?? {};
}

/**
 * Persists one plugin's data object. The plugin runtime calls this through
 * `yapmod.flushStorage()`, both explicitly and after top-level writes.
 */
function savePluginStorage(id: string, storage: Record<string, unknown>): void {
  const data = readData();
  data[id] = storage;
  writeData(data);
}

/** The live data object behind `yapmod.storage`. `PropertyKey` keeps symbol access type-clean. */
type StorageState = Record<PropertyKey, unknown>;

export interface ReactivePluginStorage {
  /** The reactive view handed to plugins as `yapmod.storage`. */
  storage: Record<string, unknown>;
  /** Writes the plugin's current data object to `localStorage`. */
  persist(): void;
}

/**
 * Loads one plugin's persisted data as a signal-backed store.
 *
 * Every read goes through the signal, so anything rendered from
 * `yapmod.storage` re-renders when a top-level value it read changes. A
 * top-level write copies the state, swaps the signal and persists
 * immediately — the common case of `storage.count = n` needs no flush.
 *
 * Deeper writes (`storage.nested.x = 1`) reach the plain object the state
 * holds: they are not observed and not auto-persisted, exactly like before
 * the store existed, and `flushStorage()` writes them out.
 *
 * Solid's own store proxies are deliberately write-protected ("Cannot
 * mutate a Store directly"), so this wraps a plain object instead of a
 * `createStore` proxy: plugins have always mutated storage like a plain
 * object, and that has to keep working.
 */
export function createPluginStorage(id: string): ReactivePluginStorage {
  const [state, setState] = createSignal<StorageState>(loadPluginStorage(id) as StorageState);

  const persist = (): void => {
    savePluginStorage(id, state());
  };

  const storage = new Proxy({} as Record<string, unknown>, {
    get(_target, property) {
      return state()[property];
    },
    set(_target, property, value) {
      setState((prev) => ({ ...prev, [property]: value }));
      persist();
      return true;
    },
    deleteProperty(_target, property) {
      setState((prev) => {
        const next = { ...prev };
        Reflect.deleteProperty(next, property);
        return next;
      });
      persist();
      return true;
    },
    has(_target, property) {
      return property in state();
    },
    ownKeys() {
      return Reflect.ownKeys(state());
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Object.getOwnPropertyDescriptor(state(), property);
      if (!descriptor) return undefined;

      // The proxy's target is an empty placeholder, so real properties must
      // be reported as configurable to satisfy the proxy invariants.
      return { ...descriptor, configurable: true };
    },
  });

  return { storage, persist };
}
