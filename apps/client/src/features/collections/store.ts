import { createSignal } from 'solid-js';
import { isRecord } from '../plugins/manifest';
import {
  collectionUrl,
  parseCollection,
  parseThemeCollection,
  type CollectionInfo,
} from './manifest';

function createCollectionStore<T extends CollectionInfo>(
  storageKey: string,
  parse: (value: unknown, source: string) => T,
) {
  function load(): T[] {
    try {
      const parsed: unknown = JSON.parse(globalThis.localStorage.getItem(storageKey) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      const saved = new Map<string, T>();
      for (const entry of parsed) {
        try {
          if (!isRecord(entry) || typeof entry.url !== 'string') continue;
          const collection = parse(entry, entry.url);
          saved.set(collection.url, collection);
        } catch {
          // One malformed entry must not discard the remaining collections.
        }
      }
      return [...saved.values()];
    } catch {
      return [];
    }
  }

  const [collections, setCollections] = createSignal<T[]>(load());

  function commit(next: T[]): void {
    try {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error('[yapmod] could not save collections', error);
      throw new Error('Could not save collections to browser storage.', { cause: error });
    }
    setCollections(next);
  }

  async function fetchCollection(source: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(source, { cache: 'no-cache' });
    } catch (error) {
      throw new Error(
        'Could not fetch the collection. Check the URL and whether Yapin allows that host.',
        { cause: error },
      );
    }
    if (!response.ok) throw new Error(`Collection request failed (${response.status}).`);
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('The collection index is not valid JSON.');
    }
    // Relative paths follow redirects, but the subscribed URL remains the identity.
    return { ...parse(data, response.url || source), url: source };
  }

  async function addCollection(rawUrl: string): Promise<void> {
    const url = collectionUrl(rawUrl);
    if (collections().some((item) => item.url === url))
      throw new Error('That collection is already added.');
    const collection = await fetchCollection(url);
    if (collections().some((item) => item.url === url))
      throw new Error('That collection is already added.');
    commit([...collections(), collection]);
  }

  async function refreshCollection(url: string): Promise<void> {
    const previous = collections().find((item) => item.url === url);
    if (!previous) return;
    const collection = await fetchCollection(url);
    // Removing or refreshing during the request must not resurrect stale data.
    if (!collections().includes(previous)) return;
    commit(collections().map((item) => (item === previous ? collection : item)));
  }

  function removeCollection(url: string): void {
    commit(collections().filter((item) => item.url !== url));
  }

  return { collections, addCollection, refreshCollection, removeCollection };
}

export const { collections, addCollection, refreshCollection, removeCollection } =
  createCollectionStore('yapmod.collections.v1', parseCollection);
export const themeCatalogs = createCollectionStore(
  'yapmod.theme-collections.v1',
  parseThemeCollection,
);
