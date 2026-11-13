import { version } from '../../../package.json';
import { Button } from '@yapmod/ui';
import { PluginsPage } from '../plugins/section';
import { ThemesPage } from '../themes/section';
import { setShowClientPlugins, showClientPlugins } from './store';
import type { SettingsGroup } from './install';

/**
 * The Yapmod group shown in Yapin's settings navigation.
 *
 * The group holds "Settings", "Plugins" and "Themes". Each panel is rendered
 * in the light DOM next to Yapin's native panel and built from the same
 * primitives as Yapin's own settings pages (`h2`, `section-label`,
 * `toggle-row`, `toggle-label`, `hint`). Only the reactive `Button` keeps
 * Yapmod's `yp-` classes, and its styles match the host `.btn` exactly.
 */
export const yapmodGroup: SettingsGroup = {
  label: 'Yapmod',
  sections: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      render: () => (
        <>
          <h2>Yapmod</h2>
          <div class="hint" style={{ 'margin-bottom': '14px' }}>
            A client mod for Yapin. It adds this group to the settings navigation and follows
            Yapin's own styles.
          </div>

          <div class="section-label">About</div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Version</div>
              <div class="hint">Installed build</div>
            </div>
            <span class="hint">v{version}</span>
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Bundle</div>
              <div class="hint">Script loaded into this page</div>
            </div>
            <span class="hint">yapmod-client.js</span>
          </div>

          <div class="section-label" style={{ 'margin-top': '18px' }}>
            Plugins
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Show client plugins</div>
              <div class="hint">
                Reveal plugins that the application running Yapmod registers in code, instead of
                ones you installed. Hiding them keeps the running ones active.
              </div>
            </div>
            <input
              class="switch"
              type="checkbox"
              checked={showClientPlugins()}
              aria-label="Show client plugins"
              onChange={(event) => setShowClientPlugins(event.currentTarget.checked)}
            />
          </div>

          <div class="section-label" style={{ 'margin-top': '18px' }}>
            Actions
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-label">Unload Yapmod</div>
              <div class="hint">Removes the mod and every element it injected into this page.</div>
            </div>
            <Button
              variant="danger"
              size="small"
              onClick={() => {
                // Disposing from inside our own panel is the quickest way to
                // see that every cleanup runs while the settings modal is open.
                globalThis.YapmodClient?.dispose();
              }}
            >
              Unload
            </Button>
          </div>

          <p class="hint" style={{ 'margin-top': '12px' }}>
            Only the Yapmod Button keeps its own stylesheet; the page itself uses Yapin's classes
            and theme variables.
          </p>
        </>
      ),
    },
    {
      id: 'plugins',
      label: 'Plugins',
      icon: 'puzzle',
      render: () => <PluginsPage />,
    },
    {
      id: 'themes',
      label: 'Themes',
      icon: 'palette',
      render: () => <ThemesPage />,
    },
  ],
};
