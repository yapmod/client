import type { Client } from '@yapmod/types';
import { subscribeThemes, themeState } from './store';
import type { ThemeState } from './types';

const STYLE_ID = 'yapmod-theme-styles';
const DARK_MEDIA = '(prefers-color-scheme: dark)';
const ONLINE_THEME_RETRY_MS = 60_000;

/**
 * Online CSS is fetched and inlined instead of linked with `@import`.
 *
 * Yapin enforces a `style-src` that only allows the page itself, so an
 * external stylesheet link is blocked. `connect-src` does allow a handful of
 * hosts (notably `raw.githubusercontent.com`), so fetching the CSS and putting
 * it in the same `<style>` element works. Failed URLs are retried after a
 * minute instead of on every DOM mutation.
 */
const onlineCss = new Map<string, string>();
const pendingOnline = new Set<string>();
const failedOnline = new Map<string, number>();
let engineDisposed = false;

/** The host's active theme, with a sensible fallback outside Yapin. */
function currentMode(): 'light' | 'dark' {
  const root = document.documentElement;

  // Yapin exposes both the chosen theme (`data-theme`, which can be "system")
  // and the resolved look (`data-look`). Prefer the resolved value.
  const look = root.dataset.look;
  if (look === 'light' || look === 'dark') return look;

  const theme = root.dataset.theme;
  if (theme === 'light' || theme === 'dark') return theme;

  const scheme = getComputedStyle(root).colorScheme;
  if (scheme.includes('light') && !scheme.includes('dark')) return 'light';

  return matchMedia(DARK_MEDIA).matches ? 'dark' : 'light';
}

/**
 * Resolves `@light` / `@dark` line prefixes against the theme the host is
 * currently using. Unprefixed URLs are always included.
 */
function resolveOnlineThemes(lines: string[]): string[] {
  const mode = currentMode();
  const resolved: string[] = [];

  for (const line of lines) {
    const match = /^@(light|dark)\s+(.*)$/.exec(line);
    if (!match) {
      resolved.push(line);
      continue;
    }

    const [, target, url] = match;
    if (target === mode && url) resolved.push(url);
  }

  return resolved;
}

/** URLs of the online themes that should be applied right now. */
function enabledOnlineUrls(state: ThemeState): string[] {
  const enabledOnline = new Set(state.enabledOnline);
  return resolveOnlineThemes(state.online.filter((line) => enabledOnline.has(line)));
}

/**
 * Builds the injected stylesheet from cached online CSS and enabled local
 * themes. Online CSS comes first so local themes can override it.
 */
function buildCss(state: ThemeState): string {
  const online = enabledOnlineUrls(state)
    .map((url) => {
      const css = onlineCss.get(url);
      if (css === undefined) return '';

      return `/* Online theme: ${url.replace(/\*\//g, '* /')} */\n${css}`;
    })
    .filter(Boolean);

  const enabled = new Set(state.enabledLocal);
  const local = state.local
    .filter((theme) => enabled.has(theme.fileName))
    .map((theme) => `/* ${theme.name.replace(/\*\//g, '* /')} */\n${theme.css}`);

  return [...online, ...local].join('\n');
}

function shouldFetchOnlineTheme(url: string): boolean {
  if (onlineCss.has(url) || pendingOnline.has(url)) return false;

  const failedAt = failedOnline.get(url);
  return failedAt === undefined || Date.now() - failedAt >= ONLINE_THEME_RETRY_MS;
}

async function fetchOnlineTheme(url: string): Promise<void> {
  pendingOnline.add(url);

  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      throw new Error(`Expected CSS but received ${contentType} for ${url}`);
    }

    onlineCss.set(url, await response.text());
    failedOnline.delete(url);
  } catch (error) {
    failedOnline.set(url, Date.now());
    console.warn(`[yapmod] could not load online theme ${url}`, error);
  } finally {
    pendingOnline.delete(url);
    if (!engineDisposed) applyThemes();
  }
}

function requestMissingOnlineThemes(state: ThemeState): void {
  for (const url of enabledOnlineUrls(state)) {
    if (shouldFetchOnlineTheme(url)) void fetchOnlineTheme(url);
  }
}

function ensureStyle(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  (document.head ?? document.documentElement).append(style);
  return style;
}

/** Rebuilds the injected stylesheet and starts fetching missing online CSS. */
export function applyThemes(state: ThemeState = themeState()): void {
  if (engineDisposed) return;

  const css = buildCss(state);
  const style = document.getElementById(STYLE_ID);

  if (!css.trim()) {
    style?.remove();
  } else {
    ensureStyle().textContent = css;
  }

  requestMissingOnlineThemes(state);
}

/**
 * Installs the theme engine for the lifetime of the client.
 *
 * The engine owns one `<style>` element. It rebuilds that element whenever
 * the theme state changes, and when Yapin switches between light and dark
 * (needed to resolve `@light` / `@dark` online theme lines). Online themes are
 * fetched through the host's `connect-src` allowlist and inlined. Disposal
 * removes the stylesheet and every listener the engine added.
 */
export function installThemes(client: Client): void {
  engineDisposed = false;
  onlineCss.clear();
  pendingOnline.clear();
  failedOnline.clear();

  const unsubscribe = subscribeThemes(applyThemes);

  const themeObserver = new MutationObserver(() => applyThemes());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-look', 'class', 'style'],
  });

  const darkMedia = matchMedia(DARK_MEDIA);
  const onMediaChange = () => applyThemes();
  darkMedia.addEventListener('change', onMediaChange);

  client.onDispose(() => {
    engineDisposed = true;
    unsubscribe();
    themeObserver.disconnect();
    darkMedia.removeEventListener('change', onMediaChange);
    onlineCss.clear();
    pendingOnline.clear();
    failedOnline.clear();
    document.getElementById(STYLE_ID)?.remove();
  });
}
