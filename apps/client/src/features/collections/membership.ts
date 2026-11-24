import type { StoredPlugin } from '../plugins/types';
import { remotePluginId } from '../plugins/manifest';
import type { Collection, CollectionInfo, CollectionPlugin } from './manifest';

/** Source identity keeps edited local plugins out of remote collection groups. */
export function findCollectionPlugin(
  entry: CollectionPlugin,
  installed: StoredPlugin[],
): StoredPlugin | undefined {
  return installed.find((plugin) => !plugin.local && plugin.src === entry.url);
}

export function collectionPluginMatches(
  entry: CollectionPlugin,
  search: string,
  installed: StoredPlugin[],
): boolean {
  const plugin = findCollectionPlugin(entry, installed);
  return [
    entry.name,
    entry.description,
    entry.author,
    plugin?.manifest.name,
    plugin?.manifest.description,
    plugin?.manifest.author,
  ]
    .join('\n')
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}

export function collectionNameMatches(collection: CollectionInfo, search: string): boolean {
  return `${collection.name}\n${collection.description}`
    .toLowerCase()
    .includes(search.trim().toLowerCase());
}

export function collectionMatches(
  collection: Collection,
  search: string,
  installed: StoredPlugin[],
): boolean {
  return (
    collectionNameMatches(collection, search) ||
    collection.plugins.some((entry) => collectionPluginMatches(entry, search, installed))
  );
}

/** An edited plugin may retain an id that prevents installing the old source again. */
export function collectionPluginIdConflict(
  entry: CollectionPlugin,
  installed: StoredPlugin[],
): boolean {
  return installed.some((plugin) => plugin.id === remotePluginId(entry.url));
}
