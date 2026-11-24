import { Button, Icon } from '@yapmod/ui';
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  type JSX,
} from 'solid-js';
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
import type { Collection, CollectionInfo, CollectionPlugin } from './manifest';
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
        <section class="yp-plugin-card yp-collection-item">
          <div class="ss2-card-head yp-card-head">
            <div class="ss2-card-text">
              <div class="ss2-card-title">{props.plugin.name}</div>
              <Show when={props.plugin.author}>
                <div class="hint">by {props.plugin.author}</div>
              </Show>
            </div>
            <Button
              size="small"
              variant="secondary"
              disabled={busy() || conflict()}
              onClick={() => void install()}
            >
              {conflict() ? 'Unavailable' : busy() ? 'Installing...' : 'Install'}
            </Button>
          </div>
          <Show when={props.plugin.description}>
            <p class="hint">{props.plugin.description}</p>
          </Show>
          <Show when={conflict()}>
            <p class="hint">A plugin with this ID is installed from another source.</p>
          </Show>
        </section>
      }
    >
      {(plugin) => <PluginCard plugin={plugin()} embedded />}
    </Show>
  );
}

export function CollectionCard(props: {
  collection: Collection;
  search: string;
  initiallyExpanded?: boolean;
}) {
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
  return (
    <CollectionGroup
      collection={props.collection}
      search={props.search}
      initiallyExpanded={props.initiallyExpanded}
      kind="plugins"
      count={props.collection.plugins.length}
      installed={installedCount()}
      refresh={refreshCollection}
      remove={removeCollection}
    >
      <For each={matches()}>{(plugin) => <CollectionPluginCard plugin={plugin} />}</For>
    </CollectionGroup>
  );
}

export function CollectionGroup(props: {
  collection: CollectionInfo;
  search: string;
  initiallyExpanded?: boolean;
  kind: 'plugins' | 'themes';
  count: number;
  installed: number;
  refresh: (url: string) => Promise<void>;
  remove: (url: string) => void;
  children: JSX.Element;
}) {
  const [busy, setBusy] = createSignal(false);
  const [expanded, setExpanded] = createSignal(props.initiallyExpanded ?? false);
  const contentId = createUniqueId();
  createEffect(() => {
    if (props.search.trim()) setExpanded(true);
  });

  async function refresh(): Promise<void> {
    if (busy()) return;
    setBusy(true);
    try {
      await props.refresh(props.collection.url);
      showToast('Collection refreshed.', 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    const collection = props.collection;
    if (
      !(await openConfirmModal({
        title: 'Remove collection',
        body: `Remove ${collection.name}? Installed ${props.kind} will be kept.`,
        confirmText: 'Remove',
        danger: true,
      }))
    )
      return;
    try {
      props.remove(collection.url);
      showToast('Collection removed.');
    } catch (error) {
      reportError(error);
    }
  }

  return (
    <section class="ss2-card yp-collection" aria-label={`Collection: ${props.collection.name}`}>
      <div class="ss2-card-head yp-card-head">
        <button
          type="button"
          class="yp-collection-toggle ss2-card-text"
          aria-expanded={expanded()}
          aria-controls={contentId}
          aria-label={`${expanded() ? 'Collapse' : 'Expand'} ${props.collection.name}`}
          onClick={() => setExpanded(!expanded())}
        >
          <span
            class="yp-collection-chevron"
            classList={{ 'yp-collection-chevron--open': expanded() }}
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </span>
          <span class="ss2-card-text">
            <span class="ss2-card-title">{props.collection.name}</span>
            <span class="ss2-card-hint">
              {props.count} {props.kind} · {props.installed} installed
            </span>
          </span>
        </button>
        <div class="ss2-card-ctl">
          <button
            type="button"
            class="icon-btn"
            title={busy() ? 'Refreshing...' : 'Refresh collection'}
            aria-label={`Refresh ${props.collection.name}`}
            disabled={busy()}
            onClick={() => void refresh()}
          >
            <Icon name="refresh" size={16} />
          </button>
          <button
            type="button"
            class="icon-btn muted"
            title="Remove collection"
            aria-label={`Remove ${props.collection.name}`}
            disabled={busy()}
            onClick={() => void remove()}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
      <Show when={props.collection.description}>
        <p class="hint">{props.collection.description}</p>
      </Show>
      <div id={contentId} hidden={!expanded()}>
        <Show when={expanded()}>
          <Show
            when={props.count > 0}
            fallback={<p class="hint">This collection has no {props.kind} yet.</p>}
          >
            <div class="yp-collection-list">{props.children}</div>
          </Show>
        </Show>
      </div>
    </section>
  );
}
