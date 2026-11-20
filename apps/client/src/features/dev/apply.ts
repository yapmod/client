import { normalizeManifest } from '../plugins/manifest';
import { reloadPlugin, runningPluginIds, stopPlugin } from '../plugins/runtime';
import { getPluginRecord, replacePluginRecord } from '../plugins/store';
import type { StoredPlugin } from '../plugins/types';
import type { DevUpdatePayload, DevStatusPayload } from './types';

/*
 * Applies a build pushed by the dev server.
 *
 * A dev plugin is an ordinary local plugin whose id starts with `dev:`. It
 * is stored like any other plugin, so it survives a page reload and keeps
 * its own storage; the only special part is that its code is replaced from
 * the outside while the page is running.
 */

/** Reserved prefix for plugins that come from a dev server. */
export const DEV_PREFIX = 'dev:';

/** True for ids the dev server owns. */
export function isDevPluginId(id: string): boolean {
  return id.startsWith(DEV_PREFIX);
}

/**
 * Installs or replaces the code of a dev plugin.
 *
 * The new code is evaluated before the running plugin is stopped, so a
 * broken build leaves the working version running.
 */
export async function applyDevUpdate(payload: DevUpdatePayload): Promise<DevStatusPayload> {
  if (!isDevPluginId(payload.id)) {
    return { ok: false, message: `Dev plugins must use a "${DEV_PREFIX}" id.` };
  }

  const manifest = normalizeManifest({
    name: payload.name,
    author: payload.author,
    description: payload.description,
    version: payload.version,
  });

  const existing = getPluginRecord(payload.id);

  const next: StoredPlugin = {
    ...existing,
    id: payload.id,
    local: true,
    on: existing?.on ?? true,
    update: false,
    js: payload.code,
    manifest,
  };

  if (!next.on) {
    replacePluginRecord(next.id, next);
    return { ok: true, message: 'Saved, but the plugin is disabled.' };
  }

  return reloadPlugin(next);
}

/**
 * Stops every plugin that came from a dev server.
 *
 * Called when developer features are switched off: the plugins were started
 * by a dev server, so they should not keep running once the client stops
 * accepting dev updates. Their enabled flags stay untouched, so they come
 * back the next time Yapmod loads.
 */
export function stopDevPlugins(): void {
  for (const id of runningPluginIds()) {
    if (isDevPluginId(id)) stopPlugin(id);
  }
}
