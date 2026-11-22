import { createClient } from '@yapmod/core';
import type { ClientHandle, PluginUi } from '@yapmod/types';
import {
  createIconRegistry,
  Badge,
  IconButton,
  Tabs,
  Button,
  Divider,
  Hint,
  Icon,
  Input,
  Panel,
  Select,
  SettingsPage,
  SettingRow,
  SettingText,
  Section,
  Switch,
  Textarea,
  appendStyle,
  injectStyles,
  removeStyles,
} from '@yapmod/ui';
import { version } from '../package.json';
import { closeAllModals } from './lib/modal';
import { sharedSolid } from './lib/solid';
import { openModal } from './lib/modal';
import { showToast } from './lib/toast';
import { disposeToasts } from './lib/toast';
import { installPlugins, registerClientPlugin } from './features/plugins/runtime';
import type { ClientPlugin } from './features/plugins/types';
import { installDev } from './features/dev/bridge';
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
  installDev(client);
  installSettings(client, [yapmodGroup]);
  client.onDispose(closeAllModals);
  client.onDispose(disposeToasts);

  const publicStyles = new Set<HTMLStyleElement>();
  client.onDispose(() => {
    for (const style of publicStyles) style.remove();
    publicStyles.clear();
  });

  const icons = createIconRegistry();
  client.onDispose(icons.dispose);

  const ui = {
    registerIcon: icons.registerIcon,
    showToast,
    openModal,
    injectCss(css) {
      if (client.state === 'disposed') return () => {};
      const style = appendStyle(css);
      publicStyles.add(style);
      return () => {
        if (publicStyles.delete(style)) style.remove();
      };
    },
    Badge,
    IconButton,
    Tabs,
    Button,
    Hint,
    Panel,
    Icon,
    Switch,
    Input,
    Textarea,
    Select,
    SettingsPage,
    Section,
    SettingRow,
    SettingText,
    Divider,
  } satisfies PluginUi;

  const handle: YapmodClientHandle = Object.freeze({
    version,
    api: sharedSolid,
    ui,
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
