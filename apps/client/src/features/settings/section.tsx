import { Hint, Section, SettingRow, SettingsPage, Switch } from '@yapmod/ui';
import { Show } from 'solid-js';
import { devStatus } from '../dev/status';
import { stopDevPlugins } from '../dev/apply';
import { PluginsPage } from '../plugins/section';
import { ThemesPage } from '../themes/section';
import {
  developerFeatures,
  setDeveloperFeatures,
  setShowClientPlugins,
  showClientPlugins,
} from './store';
import type { SettingsGroup } from './install';

/**
 * The Yapmod group shown in Yapin's settings navigation.
 *
 * The group holds "Settings", "Plugins" and "Themes". Each panel is rendered
 * in the light DOM next to Yapin's native panel and built from the DSL
 * components in `@yapmod/ui` (`SettingsPage`, `Section`, `SettingRow`, etc.)
 * which reproduce Yapin's own settings primitives.
 */
export const yapmodGroup: SettingsGroup = {
  label: 'Yapmod',
  sections: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      render: () => (
        <SettingsPage
          title="Yapmod"
          description="A client mod for Yapin. It adds this group to the settings navigation and follows Yapin's own styles."
        >
          <Section label="Developer">
            <SettingRow
              label="Developer features"
              hint="Accept hot updates from a local dev server. While this is on, the client evaluates the code a dev server on localhost pushes into the page. Turn it off when you are done."
            >
              <Switch
                checked={developerFeatures()}
                aria-label="Developer features"
                onChange={(enabled) => {
                  setDeveloperFeatures(enabled);
                  // Dev plugins were started by a dev server; they stop with it.
                  if (!enabled) stopDevPlugins();
                }}
              />
            </SettingRow>

            <Show when={developerFeatures()}>
              <>
                <Hint style={{ display: 'block', 'margin-top': '8px', 'margin-bottom': '10px' }}>
                  {devStatus().connected
                    ? `Connected to ${devStatus().plugin ?? 'the dev server'}.`
                    : 'Waiting for a dev server. Open the control page it prints and click "Open Yapin".'}
                  {devStatus().error ? ` Last error: ${devStatus().error}` : ''}
                </Hint>

                <SettingRow
                  label="Show client plugins"
                  hint="Reveal plugins that the application running Yapmod registers in code, instead of ones you installed. Hiding them keeps the running ones active."
                >
                  <Switch
                    checked={showClientPlugins()}
                    aria-label="Show client plugins"
                    onChange={setShowClientPlugins}
                  />
                </SettingRow>
              </>
            </Show>
          </Section>
        </SettingsPage>
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
