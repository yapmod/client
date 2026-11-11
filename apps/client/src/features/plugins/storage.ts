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
export function loadPluginStorage(id: string): Record<string, unknown> {
  return readData()[id] ?? {};
}

/**
 * Persists one plugin's data object. Plugins call this through
 * `yapmod.flushStorage()` after mutating their `yapmod.storage` object.
 */
export function savePluginStorage(id: string, storage: Record<string, unknown>): void {
  const data = readData();
  data[id] = storage;
  writeData(data);
}
