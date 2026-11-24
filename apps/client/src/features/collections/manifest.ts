import { safeHttpUrl } from '../../lib/url';
import { isRecord, normalizeRemoteSource, readString, remotePluginId } from '../plugins/manifest';

export interface CollectionEntry {
  name: string;
  description: string;
  author: string;
  url: string;
}

export interface CollectionInfo {
  schemaVersion: 1;
  url: string;
  name: string;
  description: string;
}

export type CollectionPlugin = CollectionEntry;
export interface Collection extends CollectionInfo {
  plugins: CollectionEntry[];
}
export interface ThemeCollection extends CollectionInfo {
  themes: CollectionEntry[];
}

export function collectionUrl(value: string): string {
  const safe = safeHttpUrl(value.trim());
  if (!safe) throw new Error('Enter a valid http(s) collection index URL.');
  const url = new URL(safe);
  if (url.username || url.password) throw new Error('Collection URLs cannot contain credentials.');
  url.hash = '';
  return url.href;
}

/** Validate the whole index before replacing a saved collection. Never execute its contents. */
function parseIndex(value: unknown, source: string, kind: 'plugins' | 'themes') {
  const url = collectionUrl(source);
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('Expected a collection with schemaVersion: 1.');
  }
  const list = value[kind];
  if (!Array.isArray(list)) throw new Error(`Expected a collection with a ${kind} array.`);
  const name = readString(value.name)?.trim();
  if (!name) throw new Error('The collection must have a name.');
  const ids = new Set<string>();
  const entries = list.map((entry, index): CollectionEntry => {
    const label = `${kind === 'themes' ? 'Theme' : 'Plugin'} ${index + 1}`;
    if (!isRecord(entry) || !readString(entry.name)?.trim() || !readString(entry.url)?.trim()) {
      throw new Error(`${label} must have a name and URL.`);
    }
    let resolved: string;
    try {
      resolved = collectionUrl(new URL(String(entry.url), url).href);
    } catch {
      throw new Error(`${label} has an invalid http(s) URL.`);
    }
    const src = kind === 'themes' ? resolved : normalizeRemoteSource(resolved);
    if (!src) throw new Error(`${label} has an invalid plugin URL.`);
    const id = kind === 'themes' ? src : remotePluginId(src);
    if (ids.has(id)) throw new Error(`${label} duplicates another entry URL.`);
    ids.add(id);
    return {
      name: String(entry.name).trim(),
      url: src,
      description: readString(entry.description)?.trim() ?? '',
      author: readString(entry.author)?.trim() ?? '',
    };
  });
  return {
    schemaVersion: 1 as const,
    url,
    name,
    description: readString(value.description)?.trim() ?? '',
    entries,
  };
}

export function parseCollection(value: unknown, source: string): Collection {
  const { entries, ...info } = parseIndex(value, source, 'plugins');
  return { ...info, plugins: entries };
}

export function parseThemeCollection(value: unknown, source: string): ThemeCollection {
  const { entries, ...info } = parseIndex(value, source, 'themes');
  return { ...info, themes: entries };
}
