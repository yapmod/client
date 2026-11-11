export type OnlineThemeMode = 'always' | 'light' | 'dark';

export interface ParsedOnlineTheme {
  /** The exact persisted line, including any `@light` / `@dark` prefix. */
  line: string;
  url: string;
  mode: OnlineThemeMode;
}

/** Splits a persisted online-theme line into its URL and light/dark mode. */
export function parseOnlineTheme(line: string): ParsedOnlineTheme {
  const normalized = line.trim();
  const match = /^@(light|dark)\s+(.*)$/.exec(normalized);

  if (match) {
    return {
      line: normalized,
      mode: match[1] as 'light' | 'dark',
      url: (match[2] ?? '').trim(),
    };
  }

  return { line: normalized, url: normalized, mode: 'always' };
}

/** Builds the persisted line for an online theme. */
export function onlineThemeLine(url: string, mode: OnlineThemeMode): string {
  return mode === 'always' ? url : `@${mode} ${url}`;
}

/** A readable title derived from the CSS file name. */
export function onlineThemeName(url: string): string {
  try {
    const parsed = new URL(url);
    const file = parsed.pathname.split('/').filter(Boolean).at(-1) ?? parsed.hostname;
    const decoded = decodeURIComponent(file);
    const name = decoded
      .replace(/\.theme\.css$/i, '')
      .replace(/\.css$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    return name || parsed.hostname;
  } catch {
    return url;
  }
}

/** Human-readable label for the light/dark mode badge. */
export function onlineModeLabel(mode: OnlineThemeMode): string {
  if (mode === 'light') return 'Light theme';
  if (mode === 'dark') return 'Dark theme';
  return 'Always';
}
