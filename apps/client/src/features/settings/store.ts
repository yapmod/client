import { createSignal } from 'solid-js';

const STORAGE_KEY = 'yapmod.settings.v1';

/** Yapmod-wide preferences that are not tied to a single feature. */
interface YapmodSettings {
  /** Whether the Plugins page shows the client-registered plugin section. */
  showClientPlugins: boolean;
  /**
   * Whether the client accepts hot updates from a local dev server.
   *
   * Off by default: an enabled client evaluates code pushed into the page,
   * which is only safe while the developer is in control of the browser.
   */
  developerFeatures: boolean;
}

const DEFAULT_SETTINGS: YapmodSettings = {
  showClientPlugins: false,
  developerFeatures: false,
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
    developerFeatures:
      typeof parsed.developerFeatures === 'boolean'
        ? parsed.developerFeatures
        : DEFAULT_SETTINGS.developerFeatures,
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

  const next: YapmodSettings = { ...settings(), showClientPlugins: value };
  persist(next);
  setSettings(next);
}

/** Whether the client accepts hot updates from a local dev server. */
export function developerFeatures(): boolean {
  return settings().developerFeatures;
}

/**
 * Turns developer features on or off.
 *
 * While they are off, the client ignores every message from a dev server,
 * so a stray dev server cannot push code into the page.
 */
export function setDeveloperFeatures(value: boolean): void {
  if (settings().developerFeatures === value) return;

  const next: YapmodSettings = { ...settings(), developerFeatures: value };
  persist(next);
  setSettings(next);
}
