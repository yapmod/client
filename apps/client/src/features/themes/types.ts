/**
 * A CSS theme installed from a file and kept in this browser.
 *
 * `fileName` is the theme's stable identity. It is the uploaded file's name,
 * so re-uploading a theme with the same name replaces it and keeps its
 * enabled state.
 */
export interface LocalTheme {
  fileName: string;
  name: string;
  author: string;
  description: string;
  version?: string;
  website?: string;
  invite?: string;
  css: string;
}

/** Everything the theme feature persists between page loads. */
export interface ThemeState {
  /** Installed local themes, in the order they were added. */
  local: LocalTheme[];
  /** File names of the local themes that are currently enabled. */
  enabledLocal: string[];
  /** Raw online-theme lines: one CSS URL per line, optionally `@light`/`@dark` prefixed. */
  online: string[];
  /** Raw online-theme lines that are currently enabled. */
  enabledOnline: string[];
}
