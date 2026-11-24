import { themeCatalogs } from '../collections/store';
import { Button, Icon, Input, Select, Tabs, Textarea } from '@yapmod/ui';
import { Show, createSignal, type Accessor, type Setter } from 'solid-js';
import { openModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { createLocalTheme, safeHttpUrl } from './metadata';
import { onlineThemeLine, type OnlineThemeMode } from './online';
import { addLocalThemes, addOnlineTheme, themeState } from './store';

/** The themes an online theme can be applied to. */
const THEME_MODES = [
  { value: 'always', label: 'Always' },
  { value: 'light', label: 'Light theme' },
  { value: 'dark', label: 'Dark theme' },
];

type ThemeSource = 'local' | 'online' | 'collection';

interface ThemeEditorState {
  source: Accessor<ThemeSource>;
  setSource: Setter<ThemeSource>;
  collectionUrl: Accessor<string>;
  setCollectionUrl: Setter<string>;
  busy: Accessor<boolean>;
  url: Accessor<string>;
  setUrl: Setter<string>;
  mode: Accessor<OnlineThemeMode>;
  setMode: Setter<OnlineThemeMode>;
  name: Accessor<string>;
  setName: Setter<string>;
  author: Accessor<string>;
  setAuthor: Setter<string>;
  description: Accessor<string>;
  setDescription: Setter<string>;
  css: Accessor<string>;
  setCss: Setter<string>;
  error: Accessor<string>;
  canSubmit: () => boolean;
  submit: (close: () => void) => Promise<void>;
  syncMetadata: () => void;
  setFileInput: (element: HTMLInputElement | undefined) => void;
  readFile: (files: FileList | null) => Promise<void>;
}

function fileNameFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'pasted-theme'}.theme.css`;
}

function createEditorState(): ThemeEditorState {
  const [source, setSource] = createSignal<ThemeSource>('local');
  const [collectionUrl, setCollectionUrl] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [url, setUrl] = createSignal('');
  const [mode, setMode] = createSignal<OnlineThemeMode>('always');
  const [name, setName] = createSignal('');
  const [author, setAuthor] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [css, setCss] = createSignal('');
  const [error, setError] = createSignal('');

  let fileInput: HTMLInputElement | undefined;
  let uploadedFileName = '';

  const canSubmit = () => {
    if (busy()) return false;
    if (source() === 'collection') return Boolean(collectionUrl().trim());
    return Boolean((source() === 'online' ? url() : css()).trim());
  };

  function fillMetadata(content: string, fileName: string): void {
    const theme = createLocalTheme(fileName, content);

    if (!name().trim()) setName(theme.name);
    if (!author().trim()) setAuthor(theme.author);
    if (!description().trim()) setDescription(theme.description);
  }

  function syncMetadata(): void {
    const content = css().trim();
    if (!content) return;

    fillMetadata(content, uploadedFileName || fileNameFromName(name()));
  }

  async function readFile(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      uploadedFileName = file.name;
      setCss(text);
      fillMetadata(text, file.name);
      setError('');
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Could not read that file.');
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  async function submit(close: () => void): Promise<void> {
    if (!canSubmit()) return;

    setError('');

    if (source() === 'collection') {
      setBusy(true);
      try {
        await themeCatalogs.addCollection(collectionUrl());
        showToast('Collection added.', 'success');
        close();
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Could not add collection.';
        console.error('[yapmod] could not add theme collection', cause);
        setError(message);
        showToast(message, 'error');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (source() === 'online') {
      const safe = safeHttpUrl(url().trim());
      if (!safe) {
        setError('Enter a valid http(s) CSS URL.');
        return;
      }

      const line = onlineThemeLine(safe, mode());
      if (themeState().online.includes(line)) {
        setError('That online theme is already installed.');
        return;
      }

      addOnlineTheme(line);
      showToast('Theme added.', 'success');
      close();
      return;
    }

    const content = css().trim();
    if (!content) {
      setError('Upload a CSS file or paste its contents.');
      return;
    }

    const parsed = createLocalTheme(uploadedFileName || 'pasted-theme.theme.css', content);
    const theme = {
      ...parsed,
      fileName: uploadedFileName || fileNameFromName(name().trim() || parsed.name),
      name: name().trim() || parsed.name,
      author: author().trim() || parsed.author,
      description: description().trim() || parsed.description,
    };

    addLocalThemes([theme]);
    showToast('Theme added.', 'success');
    close();
  }

  return {
    source,
    setSource,
    collectionUrl,
    setCollectionUrl,
    busy,
    url,
    setUrl,
    mode,
    setMode,
    name,
    setName,
    author,
    setAuthor,
    description,
    setDescription,
    css,
    setCss,
    error,
    canSubmit,
    submit,
    syncMetadata,
    setFileInput: (element) => {
      fileInput = element;
    },
    readFile,
  };
}

function ThemeEditorFields(props: { state: ThemeEditorState; onClose: () => void }) {
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

      <Tabs<ThemeSource>
        label="Theme source"
        value={state.source()}
        onChange={state.setSource}
        disabled={state.busy()}
        options={[
          { value: 'local', label: 'Local' },
          { value: 'online', label: 'URL' },
          { value: 'collection', label: 'Collection' },
        ]}
      >
        <Show when={state.source() === 'collection'}>
          <div class="field">
            <label for="yp-theme-collection">Collection index URL</label>
            <Input
              id="yp-theme-collection"
              inputmode="url"
              value={state.collectionUrl()}
              onChange={state.setCollectionUrl}
              placeholder="https://raw.githubusercontent.com/owner/repo/main/index.json"
            />
            <p class="hint">Add the index to browse its themes and choose which ones to install.</p>
          </div>
        </Show>
        <Show when={state.source() !== 'collection'}>
          <Show
            when={state.source() === 'online'}
            fallback={
              <>
                <div class="field">
                  <label for="yp-theme-name">Name</label>
                  <Input
                    id="yp-theme-name"
                    placeholder="Read from the CSS header when left blank"
                    value={state.name()}
                    onChange={state.setName}
                  />
                </div>

                <div class="field">
                  <label for="yp-theme-author">Author</label>
                  <Input
                    id="yp-theme-author"
                    placeholder="Read from the CSS header when left blank"
                    value={state.author()}
                    onChange={state.setAuthor}
                  />
                </div>

                <div class="field">
                  <label for="yp-theme-description">Description</label>
                  <Input
                    id="yp-theme-description"
                    placeholder="Read from the CSS header when left blank"
                    value={state.description()}
                    onChange={state.setDescription}
                  />
                </div>

                <div class="field">
                  <label for="yp-theme-css">CSS</label>
                  <Textarea
                    id="yp-theme-css"
                    rows={10}
                    spellcheck={false}
                    placeholder="Paste a .theme.css file here..."
                    value={state.css()}
                    onChange={state.setCss}
                    onBlur={state.syncMetadata}
                    style={{
                      'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      'font-size': '12px',
                      'line-height': '1.5',
                    }}
                  />
                </div>

                <div class="row-gap" style={{ 'margin-bottom': '8px' }}>
                  <label class="btn small secondary file-pick" style={{ position: 'relative' }}>
                    <Icon name="upload" size={14} />
                    Upload CSS
                    <input
                      ref={state.setFileInput}
                      class="file-pick-input"
                      type="file"
                      accept=".css"
                      onChange={(event) => void state.readFile(event.currentTarget.files)}
                    />
                  </label>
                </div>

                <p class="hint" style={{ margin: '12px 0 0' }}>
                  Theme metadata is read from the CSS header; the fields above override it.
                </p>
              </>
            }
          >
            <div class="field">
              <label for="yp-theme-url">CSS URL</label>
              <Input
                id="yp-theme-url"
                type="text"
                inputmode="url"
                placeholder="https://example.com/my-theme.theme.css"
                value={state.url()}
                onChange={state.setUrl}
              />
            </div>

            <div class="field">
              <label for="yp-theme-mode">Apply to</label>
              <Select
                id="yp-theme-mode"
                options={THEME_MODES}
                value={state.mode()}
                onChange={(mode) => state.setMode(mode as OnlineThemeMode)}
              />
            </div>

            <p class="hint" style={{ margin: '-6px 0 14px' }}>
              Use a direct CSS link from a host in Yapin's CSP allowlist. GitHub raw links
              (raw.githubusercontent.com) work; other hosts may be blocked.
            </p>
          </Show>

          <p class="hint" style={{ margin: '12px 0 0' }}>
            Themes can change Yapin's layout and may cause lag. Only install CSS you trust.
          </p>
        </Show>
      </Tabs>
    </form>
  );
}

/** Opens the Plugins-style add form for local or online themes. */
export function openThemeEditor(): void {
  const state = createEditorState();

  openModal({
    title: 'Add theme',
    wide: true,
    content: (close) => <ThemeEditorFields state={state} onClose={close} />,
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
          {state.source() === 'collection' ? 'Add Collection' : 'Add Theme'}
        </Button>
      </>
    ),
  });
}
