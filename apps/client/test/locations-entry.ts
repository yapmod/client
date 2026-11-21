import { registerLocation, openDockedPanel } from '../src/features/plugins/locations';
import { registerLocationMenu } from '../src/features/plugins/location-menus';
import {
  installPlugins,
  registerClientPlugin,
  setPluginEnabled,
} from '../src/features/plugins/runtime';
import { onCleanup } from 'solid-js';
Object.assign(globalThis, {
  locationTest: {
    registerLocation,
    openDockedPanel,
    registerLocationMenu,
    onCleanup,
    installPlugins,
    registerClientPlugin,
    setPluginEnabled,
  },
});
