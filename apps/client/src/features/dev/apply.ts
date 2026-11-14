import { normalizeManifest } from '../plugins/manifest';
import { reloadPlugin, startPlugin, stopPlugin } from '../plugins/runtime';
import {
  addPluginRecord,
  getPluginRecord,
  pluginState,
  replacePluginRecord,
} from '../plugins/store';
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

/**
 * The code that was applied last, per plugin.
 *
 * The dev server re-sends the current build whenever the page connects, so
 * the same code can arrive twice. Comparing it keeps a reconnect from
 * restarting the plugin for nothing.
 */
const applied = new Map<string, string>();

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
export function applyDevUpdate(payload: DevUpdatePayload): DevStatusPayload {
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

  if (!existing) {
    addPluginRecord({
      id: payload.id,
      local: true,
      on: true,
      update: false,
      js: payload.code,
      manifest,
    });

    applied.set(payload.id, payload.code);

    if (!startPlugin(payload.id)) {
      return { ok: false, message: 'The plugin failed to start.' };
    }

    return { ok: true };
  }

  if (applied.get(payload.id) === payload.code) {
    return { ok: true, message: 'Already up to date.' };
  }

  replacePluginRecord(payload.id, { ...existing, js: payload.code, manifest });

  if (!existing.on) {
    applied.set(payload.id, payload.code);
    return { ok: true, message: 'Saved, but the plugin is disabled.' };
  }

  const result = reloadPlugin(payload.id, payload.code);
  if (result.ok) applied.set(payload.id, payload.code);

  return result;
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
  for (const plugin of pluginState().plugins) {
    if (!isDevPluginId(plugin.id)) continue;
    stopPlugin(plugin.id);
  }
}
