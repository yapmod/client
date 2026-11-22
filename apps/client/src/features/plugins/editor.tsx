import { Button, Icon, Input, Switch, Tabs, Textarea } from '@yapmod/ui';
import { Show, createSignal, type Accessor, type Setter } from 'solid-js';
import { openModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { addLocalPlugin, addRemotePlugin, editPlugin } from './runtime';
import { addCollection } from '../collections/store';
import { getPluginRecord } from './store';
import type { StoredPlugin } from './types';

type EditorMode = 'url' | 'local' | 'collection';

interface EditorState {
  mode: Accessor<EditorMode>;
  changeMode: (mode: EditorMode) => void;
  collectionUrl: Accessor<string>;
  setCollectionUrl: Setter<string>;
  pluginId?: string;
  existing?: StoredPlugin;
  local: Accessor<boolean>;
  url: Accessor<string>;
  setUrl: Setter<string>;
  autoUpdate: Accessor<boolean>;
  setAutoUpdate: Setter<boolean>;
  name: Accessor<string>;
  setName: Setter<string>;
  author: Accessor<string>;
  setAuthor: Setter<string>;
  description: Accessor<string>;
  setDescription: Setter<string>;
  code: Accessor<string>;
  setCode: Setter<string>;
  error: Accessor<string>;
  busy: Accessor<boolean>;
  canSubmit: () => boolean;
  submit: (close: () => void) => Promise<void>;
  setFileInput: (element: HTMLInputElement | undefined) => void;
  readFile: (files: FileList | null) => Promise<void>;
}

function createEditorState(pluginId?: string): EditorState {
  const existing = pluginId ? getPluginRecord(pluginId) : undefined;

  const [mode, setMode] = createSignal<EditorMode>(existing?.local ? 'local' : 'url');
  const local = () => mode() === 'local';
  const [collectionUrl, setCollectionUrl] = createSignal('');
  const [url, setUrl] = createSignal(existing?.src ?? '');
  const [autoUpdate, setAutoUpdate] = createSignal(existing?.update ?? true);
  const [name, setName] = createSignal(existing?.manifest.name ?? '');
  const [author, setAuthor] = createSignal(existing?.manifest.author ?? '');
  const [description, setDescription] = createSignal(existing?.manifest.description ?? '');
  const [code, setCode] = createSignal(existing?.js ?? '');
  const [error, setError] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  let fileInput: HTMLInputElement | undefined;

  const canSubmit = () => {
    if (busy()) return false;
    if (mode() === 'collection') return Boolean(collectionUrl().trim());
    if (local()) return Boolean(name().trim() && author().trim() && code().trim());
    return Boolean(url().trim());
  };

  async function readFile(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setCode(text);
      if (!name().trim()) setName(file.name.replace(/\.[^.]+$/, ''));
      setError('');
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Could not read that file.');
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  async function submit(close: () => void): Promise<void> {
    if (!canSubmit()) return;

    setBusy(true);
    setError('');

    try {
      if (pluginId) {
        const wasOn = existing?.on ?? false;
        const saved = await editPlugin(pluginId, {
          local: local(),
          name: name(),
          author: author(),
          description: description(),
          code: code(),
          src: url(),
          update: autoUpdate(),
        });

        if (wasOn && !saved.on) {
          showToast('Plugin saved, but it failed to start.', 'error');
        } else {
          showToast('Plugin saved.', 'success');
        }
      } else if (mode() === 'collection') {
        await addCollection(collectionUrl());
        showToast('Collection added.', 'success');
      } else if (local()) {
        addLocalPlugin({
          name: name(),
          author: author(),
          description: description(),
          code: code(),
        });
        showToast('Plugin added.', 'success');
      } else {
        await addRemotePlugin(url(), autoUpdate());
        showToast('Plugin added.', 'success');
      }

      close();
    } catch (submitError) {
      console.error('[yapmod] could not save plugin or collection', submitError);
      if (mode() === 'collection')
        showToast(
          submitError instanceof Error ? submitError.message : 'Could not add collection.',
          'error',
        );
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setBusy(false);
    }
  }

  return {
    mode,
    changeMode: (next) => {
      if (!busy()) {
        setMode(next);
        setError('');
      }
    },
    collectionUrl,
    setCollectionUrl,
    pluginId,
    existing,
    local,
    url,
    setUrl,
    autoUpdate,
    setAutoUpdate,
    name,
    setName,
    author,
    setAuthor,
    description,
    setDescription,
    code,
    setCode,
    error,
    busy,
    canSubmit,
    submit,
    setFileInput: (element) => {
      fileInput = element;
    },
    readFile,
  };
}

function PluginEditorFields(props: { state: EditorState; onClose: () => void }) {
  const state = props.state;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void state.submit(props.onClose);
      }}
    >
      <Show when={state.error()}>
        <p class="hint" style={{ color: 'var(--danger)', margin: '0 0 12px' }}>
          {state.error()}
        </p>
      </Show>

      <Tabs<EditorMode>
        label="Plugin source"
        value={state.mode()}
        options={
          state.pluginId
            ? [
                { value: 'url', label: 'URL' },
                { value: 'local', label: 'Local' },
              ]
            : [
                { value: 'url', label: 'URL' },
                { value: 'local', label: 'Local' },
                { value: 'collection', label: 'Collection' },
              ]
        }
        disabled={state.busy()}
        onChange={state.changeMode}
      >
        <Show when={state.mode() === 'collection'}>
          <div class="field">
            <label for="yp-collection-url">Collection index URL</label>
            <Input
              id="yp-collection-url"
              inputmode="url"
              placeholder="https://raw.githubusercontent.com/owner/repo/plugin-dist/index.json"
              value={state.collectionUrl()}
              onChange={state.setCollectionUrl}
              disabled={state.busy()}
            />
          </div>
          <p class="hint">
            Add a collection to browse and install its plugins together. Use a JSON index on a host
            allowed by Yapin, such as raw.githubusercontent.com. Adding a collection does not
            install its plugins.
          </p>
        </Show>
        <Show when={state.mode() !== 'collection'}>
          <Show
            when={state.local()}
            fallback={
              <>
                <div class="field">
                  <label for="yp-plugin-url">Plugin URL</label>
                  <Input
                    id="yp-plugin-url"
                    type="text"
                    inputmode="url"
                    placeholder="https://example.com/my-plugin/"
                    value={state.url()}
                    onChange={state.setUrl}
                  />
                </div>

                <p class="hint" style={{ margin: '-6px 0 14px' }}>
                  Point at a folder containing <code>plugin.json</code> and <code>plugin.js</code>.
                  Yapin only allows downloads from a few hosts, including{' '}
                  <code>raw.githubusercontent.com</code>.
                </p>

                <div class="toggle-row">
                  <div>
                    <div class="toggle-label">Automatically update</div>
                    <div class="hint">Fetch a fresh copy when Yapin loads.</div>
                  </div>
                  <Switch
                    checked={state.autoUpdate()}
                    aria-label="Automatically update plugin"
                    onChange={state.setAutoUpdate}
                  />
                </div>
              </>
            }
          >
            <div class="field">
              <label for="yp-plugin-name">Name</label>
              <Input id="yp-plugin-name" value={state.name()} onChange={state.setName} />
            </div>

            <div class="field">
              <label for="yp-plugin-author">Author</label>
              <Input id="yp-plugin-author" value={state.author()} onChange={state.setAuthor} />
            </div>

            <div class="field">
              <label for="yp-plugin-description">Description</label>
              <Input
                id="yp-plugin-description"
                value={state.description()}
                onChange={state.setDescription}
              />
            </div>

            <div class="field">
              <label for="yp-plugin-code">Code</label>
              <Textarea
                id="yp-plugin-code"
                rows={12}
                spellcheck={false}
                value={state.code()}
                onChange={state.setCode}
              />
            </div>

            <div class="row-gap" style={{ 'margin-bottom': '8px' }}>
              <label class="btn small secondary file-pick" style={{ position: 'relative' }}>
                <Icon name="upload" size={14} />
                Upload JS
                <input
                  ref={state.setFileInput}
                  class="file-pick-input"
                  type="file"
                  accept="text/javascript,.js"
                  onChange={(event) => void state.readFile(event.currentTarget.files)}
                />
              </label>
            </div>
          </Show>
        </Show>
      </Tabs>
      <p class="hint" style={{ margin: '12px 0 0' }}>
        Plugins run with full access to the page. Only install code you trust.
      </p>
    </form>
  );
}

/** Opens the add/edit form. */
export function openPluginEditor(pluginId?: string): void {
  const state = createEditorState(pluginId);
  const title = pluginId ? `Edit ${state.existing?.manifest.name ?? 'plugin'}` : 'Add plugin';

  openModal({
    title,
    wide: true,
    content: (close) => <PluginEditorFields state={state} onClose={close} />,
    footer: (close) => (
      <>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={!state.canSubmit()}
          onClick={() => {
            void state.submit(close);
          }}
        >
          {state.busy()
            ? 'Saving...'
            : pluginId
              ? 'Save'
              : state.mode() === 'collection'
                ? 'Add Collection'
                : state.local()
                  ? 'Add'
                  : 'Fetch'}
        </Button>
      </>
    ),
  });
}
