import { Button, Icon } from '@yapmod/ui';
import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { openConfirmModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { PluginCard } from '../plugins/card';
import {
  collectionNameMatches,
  collectionPluginMatches,
  findCollectionPlugin,
  collectionPluginIdConflict,
} from './membership';
import { addRemotePlugin } from '../plugins/runtime';
import { pluginState } from '../plugins/store';
import type { Collection, CollectionPlugin } from './manifest';
import { refreshCollection, removeCollection } from './store';

function reportError(error: unknown): void {
  console.error('[yapmod] collection action failed', error);
  showToast(error instanceof Error ? error.message : 'Collection action failed.', 'error');
}

function CollectionPluginCard(props: { plugin: CollectionPlugin }) {
  const [busy, setBusy] = createSignal(false);
  const installed = () => findCollectionPlugin(props.plugin, pluginState().plugins);
  const conflict = () => collectionPluginIdConflict(props.plugin, pluginState().plugins);

  async function install(): Promise<void> {
    if (busy() || installed() || conflict()) return;
    setBusy(true);
    try {
      await addRemotePlugin(props.plugin.url, false);
      showToast('Plugin installed. Enable it when you are ready.', 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Show
      when={installed()}
      fallback={
        <section class="ss2-card">
          <div class="row-gap" style={{ 'justify-content': 'space-between' }}>
            <div>
              <div class="toggle-label">{props.plugin.name}</div>
              <Show when={props.plugin.author}>
                <div class="hint">by {props.plugin.author}</div>
              </Show>
            </div>
            <Button disabled={busy() || conflict()} onClick={() => void install()}>
              {conflict() ? 'Already installed elsewhere' : busy() ? 'Installing...' : 'Install'}
            </Button>
          </div>
          <Show when={props.plugin.description}>
            <p class="hint">{props.plugin.description}</p>
          </Show>
          <div class="hint" style={{ 'overflow-wrap': 'anywhere' }}>
            {props.plugin.url}
          </div>
        </section>
      }
    >
      {(plugin) => <PluginCard plugin={plugin()} />}
    </Show>
  );
}

export function CollectionCard(props: { collection: Collection; search: string }) {
  const [busy, setBusy] = createSignal(false);
  const [expanded, setExpanded] = createSignal(false);
  const [actionsOpen, setActionsOpen] = createSignal(false);
  const matches = createMemo(() =>
    props.collection.plugins.filter(
      (entry) =>
        collectionNameMatches(props.collection, props.search) ||
        collectionPluginMatches(entry, props.search, pluginState().plugins),
    ),
  );
  const installedCount = () =>
    props.collection.plugins.filter((entry) => findCollectionPlugin(entry, pluginState().plugins))
      .length;
  createEffect(() => {
    if (props.search.trim()) setExpanded(true);
  });

  async function refresh(): Promise<void> {
    if (busy()) return;
    setBusy(true);
    setActionsOpen(false);
    try {
      await refreshCollection(props.collection.url);
      showToast('Collection refreshed.', 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    const collection = props.collection;
    setActionsOpen(false);
    if (
      !(await openConfirmModal({
        title: 'Remove collection',
        body: `Remove ${collection.name}? Installed plugins will be kept.`,
        confirmText: 'Remove',
        danger: true,
      }))
    )
      return;
    try {
      removeCollection(collection.url);
      showToast('Collection removed.');
    } catch (error) {
      reportError(error);
    }
  }

  return (
    <section
      class="ss2-card"
      style={{
        'margin-top': '14px',
        border: '1px solid var(--yp-border, var(--border, #ffffff12))',
        'border-inline-start': '3px solid var(--yp-accent, var(--accent, #ff6b4a))',
      }}
      aria-label={`Collection: ${props.collection.name}`}
    >
      <div class="row-gap" style={{ 'justify-content': 'space-between' }}>
        <Button
          variant="ghost"
          style={{ 'max-width': '100%', 'min-width': '0' }}
          aria-expanded={expanded()}
          aria-label={`${expanded() ? 'Collapse' : 'Expand'} ${props.collection.name}`}
          onClick={() => setExpanded(!expanded())}
        >
          <Icon name="puzzle" size={18} />
          <span
            style={{
              'overflow-wrap': 'anywhere',
              'min-width': '0',
              'white-space': 'normal',
              'text-align': 'start',
            }}
          >
            {props.collection.name}
          </span>
          <span aria-hidden="true">{expanded() ? '▾' : '▸'}</span>
        </Button>
        <Button
          size="small"
          variant="ghost"
          aria-label={`${props.collection.name} collection actions`}
          aria-expanded={actionsOpen()}
          onClick={() => setActionsOpen(!actionsOpen())}
        >
          •••
        </Button>
      </div>
      <div class="hint">
        Collection · {props.collection.plugins.length} plugins · {installedCount()} installed
      </div>
      <Show when={props.collection.description}>
        <p class="hint" style={{ 'overflow-wrap': 'anywhere' }}>
          {props.collection.description}
        </p>
      </Show>
      <Show when={actionsOpen()}>
        <div class="row-gap" role="group" aria-label="Collection actions">
          <Button size="small" variant="secondary" disabled={busy()} onClick={() => void refresh()}>
            {busy() ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button size="small" variant="ghost" onClick={() => void remove()}>
            Remove collection
          </Button>
        </div>
      </Show>
      <Show when={expanded()}>
        <p class="hint" style={{ 'overflow-wrap': 'anywhere' }}>
          {props.collection.url}
        </p>
        <p class="hint">
          Install plugins individually. New installs start disabled with automatic updates off.
        </p>
        <Show
          when={props.collection.plugins.length > 0}
          fallback={<p class="hint">This collection has no plugins yet.</p>}
        >
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
            <For each={matches()}>{(plugin) => <CollectionPluginCard plugin={plugin} />}</For>
          </div>
        </Show>
      </Show>
    </section>
  );
}
