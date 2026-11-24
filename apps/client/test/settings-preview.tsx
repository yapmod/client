import { render } from 'solid-js/web';
import { uiCss } from '@yapmod/ui';
import { PluginsPage } from '../src/features/plugins/section';

import { ThemesPage } from '../src/features/themes/section';

const style = document.createElement('style');
style.textContent = uiCss;
document.head.append(style);
render(
  () => (globalThis.location.pathname === '/themes' ? <ThemesPage /> : <PluginsPage />),
  document.getElementById('settings-preview')!,
);
