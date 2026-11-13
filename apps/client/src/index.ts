import { createClient } from '@yapmod/core';
import type { ClientHandle } from '@yapmod/types';
import { injectStyles, removeStyles } from '@yapmod/ui';
import { version } from '../package.json';
import { closeAllModals } from './lib/modal';
import { disposeToasts } from './lib/toast';
import { installPlugins, registerClientPlugin } from './features/plugins/runtime';
import type { ClientPlugin } from './features/plugins/types';
import { installSettings } from './features/settings/install';
import { yapmodGroup } from './features/settings/section';
import { installThemes } from './features/themes/apply';

/**
 * The handle exposed on `globalThis.YapmodClient`: the shared `ClientHandle`
 * contract plus the entry point through which the application embedding
 * Yapmod contributes its own plugins.
 */
interface YapmodClientHandle extends ClientHandle {
  /**
   * Registers a plugin provided by this application instead of one the
   * user installs.
   *
   * The definition is validated, recorded, and started immediately when it
   * is enabled (its `defaultEnabled`, unless the user chose otherwise). It
   * shares the community plugin API, storage, settings and lifecycle, but
   * is never stored, fetched, evaluated, edited or deleted, and stays out
   * of the Plugins page unless the user turns on "Show client plugins".
   *
   * Returns `false` for an invalid or duplicate definition.
   */
  registerClientPlugin(definition: ClientPlugin): boolean;
}

declare global {
  var YapmodClient: YapmodClientHandle | undefined;
}

/**
 * Bootstraps the client.
 *
 * The bundle initializes itself when loaded. A global guard makes duplicate
 * execution safe: injecting the script a second time returns the existing
 * handle instead of starting a second runtime. After an explicit
 * `dispose()` the guard is cleared, so a later injection starts fresh.
 */
function bootstrap(): YapmodClientHandle {
  const existing = globalThis.YapmodClient;
  if (existing) return existing;

  const client = createClient();

  injectStyles();
  client.onDispose(removeStyles);
  installThemes(client);
  installPlugins(client);
  installSettings(client, [yapmodGroup]);
  client.onDispose(closeAllModals);
  client.onDispose(disposeToasts);

  const handle: YapmodClientHandle = Object.freeze({
    version,
    get state() {
      return client.state;
    },
    dispose() {
      client.dispose();
      if (globalThis.YapmodClient === handle) {
        globalThis.YapmodClient = undefined;
      }
    },
    registerClientPlugin,
  });

  globalThis.YapmodClient = handle;
  return handle;
}

export default bootstrap();
