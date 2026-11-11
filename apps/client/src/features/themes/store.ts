import { createSignal } from 'solid-js';
import { safeHttpUrl, safeInvite } from './metadata';
import type { LocalTheme, ThemeState } from './types';

const STORAGE_KEY = 'yapmod.themes.v1';

const EMPTY_STATE: ThemeState = {
  local: [],
  enabledLocal: [],
  online: [],
  enabledOnline: [],
};

type ThemeListener = (state: ThemeState) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readLocalTheme(value: unknown): LocalTheme | null {
  if (!isRecord(value)) return null;

  const fileName = readString(value.fileName);
  const css = readString(value.css);
  if (!fileName || !css) return null;

  return {
    fileName,
    name: readString(value.name) ?? fileName.replace(/\.theme\.css$/i, '').replace(/\.css$/i, ''),
    author: readString(value.author) ?? 'Unknown Author',
    description: readString(value.description) ?? 'A Yapin theme.',
    version: readString(value.version),
    website: safeHttpUrl(readString(value.website)),
    invite: safeInvite(readString(value.invite)),
    css,
  };
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

/**
 * Reads the persisted state, dropping malformed records instead of failing
 * the whole theme feature. Enabled entries that no longer have a local theme
 * are pruned so a deleted theme cannot come back on the next load.
 */
function loadState(): ThemeState {
  let parsed: unknown;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_STATE;
  }

  if (!isRecord(parsed)) return EMPTY_STATE;

  const local = Array.isArray(parsed.local)
    ? parsed.local.map(readLocalTheme).filter((theme): theme is LocalTheme => theme !== null)
    : [];
  const installed = new Set(local.map((theme) => theme.fileName));
  const enabledLocal = readStringArray(parsed.enabledLocal).filter((fileName) =>
    installed.has(fileName),
  );
  const online = [...new Set(readStringArray(parsed.online).map((line) => line.trim()))].filter(
    Boolean,
  );
  const onlineSet = new Set(online);

  // Older versions enabled every online theme. When the field is missing,
  // migrate by enabling the existing list; an explicit empty array is kept.
  const enabledOnline = Array.isArray(parsed.enabledOnline)
    ? [...new Set(readStringArray(parsed.enabledOnline).map((line) => line.trim()))].filter(
        (line) => onlineSet.has(line),
      )
    : online;

  return { local, enabledLocal, online, enabledOnline };
}

function persist(state: ThemeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[yapmod] could not save themes', error);
  }
}

const [state, setState] = createSignal<ThemeState>(loadState());
const listeners = new Set<ThemeListener>();

function commit(next: ThemeState): void {
  persist(next);
  setState(next);

  for (const listener of listeners) {
    listener(next);
  }
}

/** The current theme state. Reading it inside a Solid view makes it reactive. */
export function themeState(): ThemeState {
  return state();
}

/**
 * Calls `listener` now and after every change. The theme engine uses this to
 * rebuild the injected stylesheet; the returned function unsubscribes.
 */
export function subscribeThemes(listener: ThemeListener): () => void {
  listeners.add(listener);
  listener(state());

  return () => {
    listeners.delete(listener);
  };
}

/** Re-reads the persisted state, which also re-applies the stylesheet. */
export function reloadThemes(): void {
  commit(loadState());
}

/** Installs or replaces uploaded themes. New themes start disabled. */
export function addLocalThemes(themes: LocalTheme[]): void {
  if (themes.length === 0) return;

  const next = new Map(state().local.map((theme) => [theme.fileName, theme]));
  for (const theme of themes) next.set(theme.fileName, theme);

  commit({
    ...state(),
    local: [...next.values()],
  });
}

/** Deletes a local theme and removes it from the enabled list. */
export function removeLocalTheme(fileName: string): void {
  const current = state();

  commit({
    ...current,
    local: current.local.filter((theme) => theme.fileName !== fileName),
    enabledLocal: current.enabledLocal.filter((name) => name !== fileName),
  });
}

/** Enables or disables a local theme. */
export function setLocalThemeEnabled(fileName: string, enabled: boolean): void {
  const current = state();
  const alreadyEnabled = current.enabledLocal.includes(fileName);
  if (alreadyEnabled === enabled) return;

  commit({
    ...current,
    enabledLocal: enabled
      ? [...current.enabledLocal, fileName]
      : current.enabledLocal.filter((name) => name !== fileName),
  });
}

/** Adds one online theme line and enables it. */
export function addOnlineTheme(line: string): void {
  const normalized = line.trim();
  if (!normalized) return;

  const current = state();
  if (current.online.includes(normalized)) return;

  commit({
    ...current,
    online: [...current.online, normalized],
    enabledOnline: [...current.enabledOnline, normalized],
  });
}

/** Deletes an online theme and removes it from the enabled list. */
export function removeOnlineTheme(line: string): void {
  const current = state();

  commit({
    ...current,
    online: current.online.filter((candidate) => candidate !== line),
    enabledOnline: current.enabledOnline.filter((candidate) => candidate !== line),
  });
}

/** Enables or disables one online theme. */
export function setOnlineThemeEnabled(line: string, enabled: boolean): void {
  const current = state();
  const alreadyEnabled = current.enabledOnline.includes(line);
  if (alreadyEnabled === enabled) return;

  commit({
    ...current,
    enabledOnline: enabled
      ? [...current.enabledOnline, line]
      : current.enabledOnline.filter((candidate) => candidate !== line),
  });
}

/**
 * Replaces the online theme list. One URL per line, trimmed and deduplicated.
 * New lines are enabled; existing lines keep their enabled state.
 */
export function setOnlineThemes(lines: string[]): void {
  const current = state();
  const online = [...new Set(lines.map((line) => line.trim()).filter(Boolean))];
  const previouslyEnabled = new Set(current.enabledOnline);

  commit({
    ...current,
    online,
    enabledOnline: online.filter(
      (line) => !current.online.includes(line) || previouslyEnabled.has(line),
    ),
  });
}
