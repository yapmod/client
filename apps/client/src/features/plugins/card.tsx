import { Button, Icon, Switch } from '@yapmod/ui';
import { Show } from 'solid-js';
import { openConfirmModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { openPluginEditor } from './editor';
import {
  hasPluginSettings,
  removePlugin,
  restorePlugin,
  setPluginPinned,
  setPluginEnabled,
  showPluginSettings,
  updatePlugin,
} from './runtime';
import { isDevPluginId } from '../dev/apply';
import type { StoredPlugin } from './types';

export function PluginCard(props: { plugin: StoredPlugin }) {
  const plugin = () => props.plugin;

  async function update(): Promise<void> {
    const current = plugin();

    try {
      const result = await updatePlugin(current.id);

      if (result === 'current') {
        showToast(`${current.manifest.name} is already up to date.`);
      } else if (result === 'failed' || result === 'rolled-back') {
        showToast(`${current.manifest.name}: update ${result}.`, 'error');
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

    try {
      removePlugin(current.id);
      showToast(`${current.manifest.name} deleted.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete plugin.', 'error');
    }
  }

  return (
    <section class="ss2-card">
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
        <div style={{ flex: '1 1 0', 'min-width': '0' }}>
          <div
            class="toggle-label"
            style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}
          >
            <span>{plugin().manifest.name}</span>
            <Show when={isDevPluginId(plugin().id)}>
              <span
                class="hint"
                style={{
                  border: '1px solid var(--border, #ffffff12)',
                  'border-radius': '999px',
                  'font-size': '11px',
                  padding: '1px 8px',
                }}
              >
                Dev
              </span>
            </Show>
          </div>
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

          <Switch
            checked={plugin().on}
            aria-label={`Enable ${plugin().manifest.name}`}
            onChange={(enabled) => {
              setPluginEnabled(plugin().id, enabled);
            }}
          />
        </div>
      </div>

      <div class="hint">{plugin().manifest.description}</div>
      <Show when={!plugin().local}>
        <label class="toggle-label">
          <Switch
            checked={plugin().pinned === true}
            aria-label={`Pin ${plugin().manifest.name} version`}
            onChange={(pinned) => {
              try {
                setPluginPinned(plugin().id, pinned);
              } catch (error) {
                showToast(
                  error instanceof Error ? error.message : 'Could not pin version.',
                  'error',
                );
              }
            }}
          />
          Pin current version {plugin().manifest.version}
        </label>
        <div class="hint">
          Pinned versions skip automatic updates. Manual updates remain available. Disabled plugins
          are never updated automatically.
        </div>
      </Show>
      <Show when={plugin().previous}>
        <Button
          onClick={async () => {
            const result = await restorePlugin(plugin().id);
            showToast(
              result === 'updated' ? 'Previous version restored and pinned.' : `Restore ${result}.`,
              result === 'updated' ? 'success' : 'error',
            );
          }}
        >
          Restore previous version
        </Button>
      </Show>
    </section>
  );
}
