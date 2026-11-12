import { createSignal } from 'solid-js';

const STORAGE_KEY = 'yapmod.settings.v1';

/** Yapmod-wide preferences that are not tied to a single feature. */
export interface YapmodSettings {
  /** Whether the Plugins page shows the built-in plugin section. */
  showBuiltInPlugins: boolean;
}

const DEFAULT_SETTINGS: YapmodSettings = {
  showBuiltInPlugins: false,
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
    showBuiltInPlugins:
      typeof parsed.showBuiltInPlugins === 'boolean'
        ? parsed.showBuiltInPlugins
        : DEFAULT_SETTINGS.showBuiltInPlugins,
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

/** The current settings. Reading it inside a Solid view makes it reactive. */
export function settingsState(): YapmodSettings {
  return settings();
}

/** Whether the built-in plugin section is visible on the Plugins page. */
export function showBuiltInPlugins(): boolean {
  return settings().showBuiltInPlugins;
}

/** Persists the built-in visibility choice. It never starts or stops anything. */
export function setShowBuiltInPlugins(value: boolean): void {
  if (settings().showBuiltInPlugins === value) return;

  const next: YapmodSettings = { showBuiltInPlugins: value };
  persist(next);
  setSettings(next);
}
