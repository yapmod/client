import { Button, Icon } from '@yapmod/ui';
import { Show, createSignal, type Accessor, type Setter } from 'solid-js';
import { openModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { addLocalPlugin, addRemotePlugin, editPlugin } from './runtime';
import { getPluginRecord } from './store';
import type { StoredPlugin } from './types';

interface EditorState {
  pluginId?: string;
  existing?: StoredPlugin;
  local: Accessor<boolean>;
  setLocal: Setter<boolean>;
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

  const [local, setLocal] = createSignal(existing?.local ?? false);
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
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setBusy(false);
    }
  }

  return {
    pluginId,
    existing,
    local,
    setLocal,
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

      <div class="toggle-row" style={{ 'border-bottom': 'none', padding: '0 0 12px' }}>
        <div>
          <div class="toggle-label">Local plugin</div>
          <div class="hint">Write or upload the JavaScript instead of fetching it from a URL.</div>
        </div>
        <input
          class="switch"
          type="checkbox"
          checked={state.local()}
          aria-label="Local plugin"
          onChange={(event) => state.setLocal(event.currentTarget.checked)}
        />
      </div>

      <Show
        when={state.local()}
        fallback={
          <>
            <div class="field">
              <label for="yp-plugin-url">Plugin URL</label>
              <input
                id="yp-plugin-url"
                class="input"
                type="text"
                inputmode="url"
                placeholder="https://example.com/my-plugin/"
                value={state.url()}
                onInput={(event) => state.setUrl(event.currentTarget.value)}
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
              <input
                class="switch"
                type="checkbox"
                checked={state.autoUpdate()}
                aria-label="Automatically update plugin"
                onChange={(event) => state.setAutoUpdate(event.currentTarget.checked)}
              />
            </div>
          </>
        }
      >
        <div class="field">
          <label for="yp-plugin-name">Name</label>
          <input
            id="yp-plugin-name"
            class="input"
            value={state.name()}
            onInput={(event) => state.setName(event.currentTarget.value)}
          />
        </div>

        <div class="field">
          <label for="yp-plugin-author">Author</label>
          <input
            id="yp-plugin-author"
            class="input"
            value={state.author()}
            onInput={(event) => state.setAuthor(event.currentTarget.value)}
          />
        </div>

        <div class="field">
          <label for="yp-plugin-description">Description</label>
          <input
            id="yp-plugin-description"
            class="input"
            value={state.description()}
            onInput={(event) => state.setDescription(event.currentTarget.value)}
          />
        </div>

        <div class="field">
          <label for="yp-plugin-code">Code</label>
          <textarea
            id="yp-plugin-code"
            class="input"
            rows={12}
            spellcheck={false}
            value={state.code()}
            onInput={(event) => state.setCode(event.currentTarget.value)}
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
          {state.busy() ? 'Saving...' : pluginId ? 'Save' : state.local() ? 'Add' : 'Fetch'}
        </Button>
      </>
    ),
  });
}
