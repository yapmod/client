import { createClient } from '@yapmod/core';
import type { ClientHandle } from '@yapmod/types';
import { injectStyles, removeStyles } from '@yapmod/ui';
import { version } from '../package.json';
import { closeAllModals } from './lib/modal';
import { disposeToasts } from './lib/toast';
import { installPlugins } from './features/plugins/runtime';
import { installSettings } from './features/settings/install';
import { yapmodGroup } from './features/settings/section';
import { installThemes } from './features/themes/apply';

declare global {
  var YapmodClient: ClientHandle | undefined;
}

/**
 * Bootstraps the client.
 *
 * The bundle initializes itself when loaded. A global guard makes duplicate
 * execution safe: injecting the script a second time returns the existing
 * handle instead of starting a second runtime. After an explicit
 * `dispose()` the guard is cleared, so a later injection starts fresh.
 */
function bootstrap(): ClientHandle {
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

  const handle: ClientHandle = Object.freeze({
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
  });

  globalThis.YapmodClient = handle;
  return handle;
}

export default bootstrap();
