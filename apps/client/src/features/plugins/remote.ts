import { normalizeManifest, normalizeRemoteSource } from './manifest';
import type { PluginManifest } from './types';

export interface RemotePluginData {
  /** Normalized folder URL, always ending in `/`. */
  src: string;
  manifest: PluginManifest;
  js: string;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.text();
}

/**
 * Fetches a remote plugin folder. The metadata and code are fetched in
 * parallel; a malformed manifest or an empty script fails the install instead
 * of leaving a half-installed plugin behind.
 */
export async function fetchRemotePlugin(rawSource: string): Promise<RemotePluginData> {
  const src = normalizeRemoteSource(rawSource);
  if (!src) throw new Error('Enter a valid http(s) plugin URL.');

  const manifestUrl = new URL('plugin.json', src).href;
  const scriptUrl = new URL('plugin.js', src).href;

  let manifestText: string;
  let js: string;
  try {
    [manifestText, js] = await Promise.all([fetchText(manifestUrl), fetchText(scriptUrl)]);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Could not fetch the plugin. Check the URL and whether Yapin allows that host.',
        {
          cause: error,
        },
      );
    }
    throw error;
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestText);
  } catch {
    throw new Error('plugin.json is not valid JSON.');
  }

  if (!js.trim()) throw new Error('plugin.js is empty.');

  return {
    src,
    manifest: normalizeManifest(manifestJson),
    js,
  };
}
