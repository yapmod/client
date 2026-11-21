import { safeHttpUrl } from '../../lib/url';
import { isRecord, normalizeRemoteSource, readString, remotePluginId } from '../plugins/manifest';

export interface CollectionPlugin {
  name: string;
  description: string;
  author: string;
  url: string;
}

export interface Collection {
  schemaVersion: 1;
  url: string;
  name: string;
  description: string;
  plugins: CollectionPlugin[];
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
export function parseCollection(value: unknown, source: string): Collection {
  const url = collectionUrl(source);
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.plugins)) {
    throw new Error('Expected a collection with schemaVersion: 1 and a plugins array.');
  }
  const name = readString(value.name)?.trim();
  if (!name) throw new Error('The collection must have a name.');
  const ids = new Set<string>();
  const plugins = value.plugins.map((entry, index): CollectionPlugin => {
    const label = `Plugin ${index + 1}`;
    if (!isRecord(entry) || !readString(entry.name)?.trim() || !readString(entry.url)?.trim()) {
      throw new Error(`${label} must have a name and URL.`);
    }
    let resolved: string;
    try {
      resolved = collectionUrl(new URL(String(entry.url), url).href);
    } catch {
      throw new Error(`${label} has an invalid http(s) URL.`);
    }
    const src = normalizeRemoteSource(resolved);
    if (!src) throw new Error(`${label} has an invalid plugin URL.`);
    const id = remotePluginId(src);
    if (ids.has(id)) throw new Error(`${label} duplicates another plugin URL.`);
    ids.add(id);
    return {
      name: String(entry.name).trim(),
      url: src,
      description: readString(entry.description)?.trim() ?? '',
      author: readString(entry.author)?.trim() ?? '',
    };
  });
  return {
    schemaVersion: 1,
    url,
    name,
    description: readString(value.description)?.trim() ?? '',
    plugins,
  };
}
