import { createSignal } from 'solid-js';

const STORAGE_KEY = 'yapmod.settings.v1';

/** Yapmod-wide preferences that are not tied to a single feature. */
interface YapmodSettings {
  /** Whether the Plugins page shows the client-registered plugin section. */
  showClientPlugins: boolean;
}

const DEFAULT_SETTINGS: YapmodSettings = {
  showClientPlugins: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Reads the persisted settings, ignoring unknown or malformed values so a
 * corrupt key falls back to the defaults instead of throwing.
 */
function loadSettings(): YapmodSettings {
  let parsed: unknown;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }

  if (!isRecord(parsed)) return DEFAULT_SETTINGS;

  return {
    showClientPlugins:
      typeof parsed.showClientPlugins === 'boolean'
        ? parsed.showClientPlugins
        : DEFAULT_SETTINGS.showClientPlugins,
  };
}

function persist(settings: YapmodSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[yapmod] could not save settings', error);
  }
}

const [settings, setSettings] = createSignal<YapmodSettings>(loadSettings());

/** Whether the client-registered plugin section is visible on the Plugins page. */
export function showClientPlugins(): boolean {
  return settings().showClientPlugins;
}

/** Persists the visibility choice. It never starts or stops anything. */
export function setShowClientPlugins(value: boolean): void {
  if (settings().showClientPlugins === value) return;

  const next: YapmodSettings = { showClientPlugins: value };
  persist(next);
  setSettings(next);
}
