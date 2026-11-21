import { Button, Input, SettingsPage } from '@yapmod/ui';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { openConfirmModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { remotePluginId } from '../plugins/manifest';
import { addRemotePlugin } from '../plugins/runtime';
import { pluginState } from '../plugins/store';
import type { Collection, CollectionPlugin } from './manifest';
import { addCollection, collections, refreshCollection, removeCollection } from './store';

function reportError(error: unknown): void {
  console.error('[yapmod] collection action failed', error);
  showToast(error instanceof Error ? error.message : 'Collection action failed.', 'error');
}

function CollectionPluginCard(props: { plugin: CollectionPlugin }) {
  const [busy, setBusy] = createSignal(false);
  const installed = () =>
    pluginState().plugins.some(
      (plugin) =>
        plugin.id === remotePluginId(props.plugin.url) ||
        (!plugin.local && plugin.src === props.plugin.url),
    );

  async function install(): Promise<void> {
    if (busy() || installed()) return;
    setBusy(true);
    try {
      await addRemotePlugin(props.plugin.url, false);
      showToast('Plugin installed. Enable it from Plugins when you are ready.', 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="ss2-card">
      <div class="row-gap" style={{ 'justify-content': 'space-between' }}>
        <div>
          <div class="toggle-label">{props.plugin.name}</div>
          <Show when={props.plugin.author}>
            <div class="hint">by {props.plugin.author}</div>
          </Show>
        </div>
        <Button disabled={busy() || installed()} onClick={() => void install()}>
          {installed() ? 'Installed' : busy() ? 'Installing...' : 'Install'}
        </Button>
      </div>
      <Show when={props.plugin.description}>
        <p class="hint">{props.plugin.description}</p>
      </Show>
      <div class="hint" style={{ 'overflow-wrap': 'anywhere' }}>
        {props.plugin.url}
      </div>
    </section>
  );
}

function CollectionCard(props: { collection: Collection; search: string }) {
  const [busy, setBusy] = createSignal(false);
  const matches = createMemo(() => {
    const term = props.search.trim().toLowerCase();
    const collection = props.collection;
    if (`${collection.name}\n${collection.description}`.toLowerCase().includes(term))
      return collection.plugins;
    return collection.plugins.filter((plugin) =>
      `${plugin.name}\n${plugin.description}\n${plugin.author}`.toLowerCase().includes(term),
    );
  });
  const visible = () =>
    !props.search.trim() ||
    matches().length > 0 ||
    `${props.collection.name}\n${props.collection.description}`
      .toLowerCase()
      .includes(props.search.trim().toLowerCase());

  async function refresh(): Promise<void> {
    if (busy()) return;
    setBusy(true);
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
    <Show when={visible()}>
      <section style={{ 'margin-top': '20px' }} aria-label={props.collection.name}>
        <div class="row-gap" style={{ 'justify-content': 'space-between' }}>
          <h3 class="section-label">
            {props.collection.name} ({props.collection.plugins.length})
          </h3>
          <div class="row-gap">
            <Button
              size="small"
              variant="secondary"
              disabled={busy()}
              onClick={() => void refresh()}
            >
              {busy() ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button size="small" variant="ghost" onClick={() => void remove()}>
              Remove
            </Button>
          </div>
        </div>
        <Show when={props.collection.description}>
          <p class="hint">{props.collection.description}</p>
        </Show>
        <p class="hint" style={{ 'overflow-wrap': 'anywhere' }}>
          {props.collection.url}
        </p>
        <Show
          when={props.collection.plugins.length > 0}
          fallback={<p class="hint">This collection has no plugins yet.</p>}
        >
          <Show
            when={matches().length > 0}
            fallback={<p class="hint">No plugins match your search.</p>}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
              <For each={matches()}>{(plugin) => <CollectionPluginCard plugin={plugin} />}</For>
            </div>
          </Show>
        </Show>
      </section>
    </Show>
  );
}

export function CollectionsPage() {
  const [url, setUrl] = createSignal('');
  const [search, setSearch] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const hasMatches = () =>
    collections().some((collection) =>
      [
        collection.name,
        collection.description,
        ...collection.plugins.flatMap((plugin) => [plugin.name, plugin.author, plugin.description]),
      ]
        .join('\n')
        .toLowerCase()
        .includes(search().trim().toLowerCase()),
    );

  async function add(): Promise<void> {
    if (busy() || !url().trim()) return;
    setBusy(true);
    try {
      await addCollection(url());
      setUrl('');
      showToast('Collection added.', 'success');
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage
      title="Collections"
      description="Browse plugin collections from a shared JSON index. Collections are saved in this browser."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <label for="yp-collection-url">Collection index URL</label>
        <div class="row-gap" style={{ 'margin-top': '8px' }}>
          <Input
            id="yp-collection-url"
            inputmode="url"
            placeholder="https://raw.githubusercontent.com/owner/repo/plugin-dist/index.json"
            value={url()}
            onChange={setUrl}
            disabled={busy()}
            style={{ flex: '1 1 220px', width: 'auto' }}
          />
          <Button type="submit" disabled={busy() || !url().trim()}>
            {busy() ? 'Adding...' : 'Add Collection'}
          </Button>
        </div>
      </form>
      <p class="hint">
        Use a host allowed by Yapin, such as raw.githubusercontent.com. Refresh a collection to
        fetch its latest listing.
      </p>
      <p class="hint">
        Plugins run with full access to the page. Only install code you trust. Installed plugins
        start disabled, with automatic updates off; manage them in Plugins.
      </p>
      <Show
        when={collections().length > 0}
        fallback={<p class="hint">No collections added yet. Paste an index URL to get started.</p>}
      >
        <Input
          type="search"
          aria-label="Search collections and plugins"
          placeholder="Search collections and plugins..."
          value={search()}
          onChange={setSearch}
        />
        <For each={collections()}>
          {(collection) => <CollectionCard collection={collection} search={search()} />}
        </For>
        <Show when={!hasMatches()}>
          <p class="hint">No collections or plugins match your search.</p>
        </Show>
      </Show>
    </SettingsPage>
  );
}
