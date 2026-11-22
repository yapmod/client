import { Button, Icon, Switch } from '@yapmod/ui';
import { Show, createSignal } from 'solid-js';
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

export function PluginCard(props: { plugin: StoredPlugin; embedded?: boolean }) {
  const plugin = () => props.plugin;
  const [busy, setBusy] = createSignal(false);

  async function update(): Promise<void> {
    if (busy()) return;
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  async function restore(): Promise<void> {
    if (busy()) return;
    setBusy(true);
    try {
      const result = await restorePlugin(plugin().id);
      showToast(
        result === 'updated' ? 'Previous version restored and pinned.' : `Restore ${result}.`,
        result === 'updated' ? 'success' : 'error',
      );
    } catch (error) {
      console.error('[yapmod] could not restore plugin', error);
      showToast(error instanceof Error ? error.message : 'Could not restore plugin.', 'error');
    } finally {
      setBusy(false);
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
    <section
      classList={{
        'yp-plugin-card': true,
        'ss2-card': !props.embedded,
        'yp-collection-item': props.embedded,
      }}
    >
      <div class="ss2-card-head yp-card-head">
        <div class="ss2-card-text">
          <div
            class="ss2-card-title"
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
              disabled={busy()}
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
            disabled={busy()}
            onClick={() => openPluginEditor(plugin().id)}
          >
            <Icon name="pencil" size={16} />
          </button>

          <button
            type="button"
            class="icon-btn muted"
            title="Delete plugin"
            aria-label={`Delete ${plugin().manifest.name}`}
            disabled={busy()}
            onClick={() => void remove()}
          >
            <Icon name="trash" size={16} />
          </button>

          <Switch
            checked={plugin().on}
            disabled={busy()}
            aria-label={`Enable ${plugin().manifest.name}`}
            onChange={(enabled) => {
              setPluginEnabled(plugin().id, enabled);
            }}
          />
        </div>
      </div>

      <div class="hint">{plugin().manifest.description}</div>
      <Show
        when={!plugin().local || plugin().previous}
        fallback={<span class="hint">v{plugin().manifest.version}</span>}
      >
        <details class="yp-plugin-version">
          <summary>
            v{plugin().manifest.version}
            <Show when={plugin().pinned}> · Pinned</Show>
            <span class="yp-version-label">Version options</span>
          </summary>
          <Show when={!plugin().local}>
            <label class="toggle-row">
              <div class="ss2-card-text">
                <div class="toggle-label">Pin this version</div>
                <div class="hint">Pause automatic updates. You can still update manually.</div>
              </div>
              <Switch
                checked={plugin().pinned === true}
                disabled={busy()}
                aria-label={`Pin ${plugin().manifest.name} version`}
                onChange={(pinned) => {
                  try {
                    setPluginPinned(plugin().id, pinned);
                  } catch (error) {
                    console.error('[yapmod] could not pin plugin version', error);
                    showToast(
                      error instanceof Error ? error.message : 'Could not pin version.',
                      'error',
                    );
                  }
                }}
              />
            </label>
          </Show>
          <Show when={plugin().previous}>
            <Button
              size="small"
              variant="secondary"
              disabled={busy()}
              onClick={() => void restore()}
            >
              Restore v{plugin().previous?.manifest.version}
            </Button>
          </Show>
        </details>
      </Show>
    </section>
  );
}
