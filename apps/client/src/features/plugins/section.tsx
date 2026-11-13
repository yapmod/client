import { Button, Icon } from '@yapmod/ui';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { openConfirmModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { showClientPlugins } from '../settings/store';
import { openPluginEditor } from './editor';
import {
  hasPluginSettings,
  removePlugin,
  setPluginEnabled,
  showPluginSettings,
  updatePlugin,
} from './runtime';
import { clientPlugins, clientPluginEnabled, getPluginRecord, pluginState } from './store';
import type { ClientPlugin, StoredPlugin } from './types';

function PluginCard(props: { plugin: StoredPlugin }) {
  const plugin = () => props.plugin;

  async function update(): Promise<void> {
    const current = plugin();
    const wasOn = current.on;

    try {
      const result = await updatePlugin(current.id);
      const saved = getPluginRecord(current.id);

      if (result === 'current') {
        showToast(`${current.manifest.name} is already up to date.`);
      } else if (wasOn && !saved?.on) {
        showToast(`${current.manifest.name} updated, but it failed to start.`, 'error');
      } else {
        showToast(`${current.manifest.name} updated.`);
      }
    } catch (error) {
      console.error('[yapmod] could not update plugin', error);
      showToast(error instanceof Error ? error.message : 'Could not update plugin.', 'error');
    }
  }

  async function remove(): Promise<void> {
    const current = plugin();
    const confirmed = await openConfirmModal({
      title: 'Delete plugin',
      body: `Delete ${current.manifest.name}? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (!confirmed) return;

    removePlugin(current.id);
    showToast(`${current.manifest.name} deleted.`);
  }

  return (
    <section class="ss2-card">
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
        <div style={{ flex: '1 1 0', 'min-width': '0' }}>
          <div class="toggle-label">{plugin().manifest.name}</div>
          <div class="hint">by {plugin().manifest.author}</div>
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'flex-end',
            'flex-wrap': 'wrap',
            gap: '4px',
          }}
        >
          <Show when={hasPluginSettings(plugin().id) && plugin().on}>
            <button
              type="button"
              class="icon-btn"
              title="Plugin settings"
              aria-label={`${plugin().manifest.name} settings`}
              onClick={() => showPluginSettings(plugin().id)}
            >
              <Icon name="settings" size={16} />
            </button>
          </Show>

          <Show when={!plugin().local}>
            <button
              type="button"
              class="icon-btn"
              title="Update plugin"
              aria-label={`Update ${plugin().manifest.name}`}
              onClick={() => void update()}
            >
              <Icon name="refresh" size={16} />
            </button>
          </Show>

          <button
            type="button"
            class="icon-btn"
            title="Edit plugin"
            aria-label={`Edit ${plugin().manifest.name}`}
            onClick={() => openPluginEditor(plugin().id)}
          >
            <Icon name="pencil" size={16} />
          </button>

          <button
            type="button"
            class="icon-btn muted"
            title="Delete plugin"
            aria-label={`Delete ${plugin().manifest.name}`}
            onClick={() => void remove()}
          >
            <Icon name="trash" size={16} />
          </button>

          <input
            class="switch"
            type="checkbox"
            checked={plugin().on}
            aria-label={`Enable ${plugin().manifest.name}`}
            onChange={(event) => {
              const input = event.currentTarget;
              input.checked = setPluginEnabled(plugin().id, input.checked);
            }}
          />
        </div>
      </div>

      <div class="hint">{plugin().manifest.description}</div>
    </section>
  );
}

/**
 * A card for a client-registered plugin.
 *
 * It deliberately exposes less than a community card: no update, edit or
 * delete actions and no safety warning, because the plugin is provided by
 * the application running Yapmod rather than installed as code. Only the
 * settings button (when the running module exported settings) and the
 * enable switch remain.
 */
function ClientPluginCard(props: { definition: ClientPlugin }) {
  const definition = () => props.definition;
  const enabled = () => clientPluginEnabled(definition().id);

  return (
    <section class="ss2-card">
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
        <div style={{ flex: '1 1 0', 'min-width': '0' }}>
          <div
            class="toggle-label"
            style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}
          >
            <span>{definition().manifest.name}</span>
            <span
              class="hint"
              style={{
                border: '1px solid var(--border, #ffffff12)',
                'border-radius': '999px',
                'font-size': '11px',
                padding: '1px 8px',
              }}
            >
              Client
            </span>
          </div>
          <div class="hint">
            by {definition().manifest.author}
            <Show when={definition().manifest.version}> · v{definition().manifest.version}</Show>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'flex-end',
            'flex-wrap': 'wrap',
            gap: '4px',
          }}
        >
          <Show when={hasPluginSettings(definition().id) && enabled()}>
            <button
              type="button"
              class="icon-btn"
              title="Plugin settings"
              aria-label={`${definition().manifest.name} settings`}
              onClick={() => showPluginSettings(definition().id)}
            >
              <Icon name="settings" size={16} />
            </button>
          </Show>

          <input
            class="switch"
            type="checkbox"
            checked={enabled()}
            aria-label={`Enable ${definition().manifest.name}`}
            onChange={(event) => {
              const input = event.currentTarget;
              input.checked = setPluginEnabled(definition().id, input.checked);
            }}
          />
        </div>
      </div>

      <div class="hint">{definition().manifest.description}</div>
    </section>
  );
}

/**
 * The Plugins page.
 *
 * The layout uses a search field and an "Add Plugin" button above a list of
 * plugin cards. Each card has the
 * plugin's name, author and description, plus settings, update, edit and
 * delete actions and an enable switch. Everything is built from Yapin's own
 * settings primitives, so it keeps the host's look.
 *
 * When "Show client plugins" is on in Yapmod Settings, a second section
 * lists the client-registered plugins after the community list, filtered by
 * the same search box. The setting only controls visibility: hiding a
 * running client plugin never stops it.
 */
export function PluginsPage() {
  const [search, setSearch] = createSignal('');

  const plugins = createMemo(() => {
    const term = search().trim().toLowerCase();
    const installed = pluginState()
      .plugins.slice()
      // oxlint-disable-next-line unicorn/no-array-sort -- sorting a fresh copy
      .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));

    if (!term) return installed;

    return installed.filter((plugin) =>
      `${plugin.manifest.name}\n${plugin.manifest.author}\n${plugin.manifest.description}`
        .toLowerCase()
        .includes(term),
    );
  });

  const clientList = createMemo(() => {
    const term = search().trim().toLowerCase();
    const registered = clientPlugins()
      .slice()
      // oxlint-disable-next-line unicorn/no-array-sort -- sorting a fresh copy
      .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));

    if (!term) return registered;

    return registered.filter((definition) =>
      `${definition.manifest.name}\n${definition.manifest.author}\n${definition.manifest.description}`
        .toLowerCase()
        .includes(term),
    );
  });

  return (
    <>
      <h2>Plugins ({plugins().length})</h2>
      <div class="hint" style={{ 'margin-bottom': '14px' }}>
        Install plugins from a URL or paste JavaScript. Plugins are stored in this browser.
      </div>

      <div class="row-gap" style={{ 'margin-bottom': '14px' }}>
        <input
          class="input"
          type="search"
          placeholder="Search plugins..."
          aria-label="Search plugins"
          value={search()}
          onInput={(event) => setSearch(event.currentTarget.value)}
          style={{ flex: '1 1 220px', width: 'auto' }}
        />
        <Button onClick={() => openPluginEditor()}>
          <Icon name="plus" size={14} />
          Add Plugin
        </Button>
      </div>

      <section
        class="ss2-card"
        style={{
          'border-color':
            'color-mix(in srgb, var(--warning, #f5b544) 45%, var(--border, #ffffff12))',
        }}
      >
        <div class="toggle-label">Plugin safety</div>
        <p class="hint" style={{ margin: '0' }}>
          Plugins run arbitrary JavaScript in this page. Only install plugins from authors you
          trust.
        </p>
      </section>

      <Show
        when={pluginState().plugins.length > 0}
        fallback={
          <p class="hint" style={{ 'margin-top': '12px' }}>
            No plugins installed yet.
          </p>
        }
      >
        <Show
          when={plugins().length > 0}
          fallback={
            <p class="hint" style={{ 'margin-top': '12px' }}>
              No plugins match your search.
            </p>
          }
        >
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '10px',
              'margin-top': '12px',
            }}
          >
            <For each={plugins()}>{(plugin) => <PluginCard plugin={plugin} />}</For>
          </div>
        </Show>
      </Show>

      <Show when={showClientPlugins()}>
        <div class="section-label" style={{ 'margin-top': '22px' }}>
          Client plugins ({clientList().length})
        </div>

        <Show
          when={clientList().length > 0}
          fallback={
            <p class="hint" style={{ 'margin-top': '8px' }}>
              {clientPlugins().length === 0
                ? 'No plugins are registered by this application.'
                : 'No client plugins match your search.'}
            </p>
          }
        >
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '10px',
              'margin-top': '10px',
            }}
          >
            <For each={clientList()}>
              {(definition) => <ClientPluginCard definition={definition} />}
            </For>
          </div>
        </Show>
      </Show>
    </>
  );
}
