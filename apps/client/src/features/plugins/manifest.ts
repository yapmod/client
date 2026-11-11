import { safeHttpUrl } from '../../lib/url';
import type { PluginManifest } from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Reads the metadata a plugin exposes, filling in the same placeholders the
 * plugin manager uses in its cards. Remote manifests and local form fields
 * both go through this function, so every stored record has the same shape.
 */
export function normalizeManifest(
  value: unknown,
  fallback: Partial<PluginManifest> = {},
): PluginManifest {
  const record = isRecord(value) ? value : {};

  return {
    name: readString(record.name)?.trim() || fallback.name?.trim() || 'Unnamed Plugin',
    author: readString(record.author)?.trim() || fallback.author?.trim() || 'Unknown Author',
    description:
      readString(record.description)?.trim() || fallback.description?.trim() || 'A Yapin plugin.',
    version: readString(record.version)?.trim() || fallback.version?.trim() || undefined,
    hash: readString(record.hash)?.trim() || fallback.hash?.trim() || undefined,
  };
}

/**
 * Normalizes a remote plugin folder URL. The URL points at a folder with
 * `plugin.json` and `plugin.js`. Pasting either file's URL also works,
 * because it is trimmed back to the folder that contains it.
 */
export function normalizeRemoteSource(value: string): string | undefined {
  const safe = safeHttpUrl(value.trim());
  if (!safe) return undefined;

  const url = new URL(safe);
  url.search = '';
  url.hash = '';

  let pathname = url.pathname.replace(/\/plugin\.(?:json|js)$/i, '/');
  if (!pathname.endsWith('/')) pathname += '/';
  url.pathname = pathname;

  return url.href;
}

/** Stable, readable identity for a remote plugin folder. */
export function remotePluginId(src: string): string {
  const url = new URL(src);
  return `${url.host}${url.pathname}`;
}

/**
 * Stable identity for a local plugin. Duplicate names get a trailing
 * underscore so each plugin keeps its own identity.
 */
export function localPluginId(name: string, existing: ReadonlySet<string>): string {
  let id = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-');
  if (!id) id = 'plugin';

  while (existing.has(id)) id += '_';
  return id;
}
