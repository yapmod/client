import { Button, Icon } from '@yapmod/ui';
import { Show, createSignal, type Accessor, type Setter } from 'solid-js';
import { openModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { createLocalTheme, safeHttpUrl } from './metadata';
import { onlineThemeLine, type OnlineThemeMode } from './online';
import { addLocalThemes, addOnlineTheme, themeState } from './store';

interface ThemeEditorState {
  online: Accessor<boolean>;
  setOnline: Setter<boolean>;
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
  const [online, setOnline] = createSignal(false);
  const [url, setUrl] = createSignal('');
  const [mode, setMode] = createSignal<OnlineThemeMode>('always');
  const [name, setName] = createSignal('');
  const [author, setAuthor] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [css, setCss] = createSignal('');
  const [error, setError] = createSignal('');

  let fileInput: HTMLInputElement | undefined;
  let uploadedFileName = '';

  const canSubmit = () => (online() ? Boolean(url().trim()) : Boolean(css().trim()));

  function fillMetadata(source: string, fileName: string): void {
    const theme = createLocalTheme(fileName, source);

    if (!name().trim()) setName(theme.name);
    if (!author().trim()) setAuthor(theme.author);
    if (!description().trim()) setDescription(theme.description);
  }

  function syncMetadata(): void {
    const source = css().trim();
    if (!source) return;

    fillMetadata(source, uploadedFileName || fileNameFromName(name()));
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

    if (online()) {
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

    const source = css().trim();
    if (!source) {
      setError('Upload a CSS file or paste its contents.');
      return;
    }

    const parsed = createLocalTheme(uploadedFileName || 'pasted-theme.theme.css', source);
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
    online,
    setOnline,
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

      <div class="toggle-row" style={{ 'border-bottom': 'none', padding: '0 0 12px' }}>
        <div>
          <div class="toggle-label">Online theme</div>
          <div class="hint">Fetch a CSS file from a direct link instead of uploading it.</div>
        </div>
        <input
          class="switch"
          type="checkbox"
          checked={state.online()}
          aria-label="Online theme"
          onChange={(event) => state.setOnline(event.currentTarget.checked)}
        />
      </div>

      <Show
        when={state.online()}
        fallback={
          <>
            <div class="field">
              <label for="yp-theme-name">Name</label>
              <input
                id="yp-theme-name"
                class="input"
                placeholder="Read from the CSS header when left blank"
                value={state.name()}
                onInput={(event) => state.setName(event.currentTarget.value)}
              />
            </div>

            <div class="field">
              <label for="yp-theme-author">Author</label>
              <input
                id="yp-theme-author"
                class="input"
                placeholder="Read from the CSS header when left blank"
                value={state.author()}
                onInput={(event) => state.setAuthor(event.currentTarget.value)}
              />
            </div>

            <div class="field">
              <label for="yp-theme-description">Description</label>
              <input
                id="yp-theme-description"
                class="input"
                placeholder="Read from the CSS header when left blank"
                value={state.description()}
                onInput={(event) => state.setDescription(event.currentTarget.value)}
              />
            </div>

            <div class="field">
              <label for="yp-theme-css">CSS</label>
              <textarea
                id="yp-theme-css"
                class="input"
                rows={10}
                spellcheck={false}
                placeholder="Paste a .theme.css file here..."
                value={state.css()}
                onInput={(event) => state.setCss(event.currentTarget.value)}
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
          <input
            id="yp-theme-url"
            class="input"
            type="text"
            inputmode="url"
            placeholder="https://example.com/my-theme.theme.css"
            value={state.url()}
            onInput={(event) => state.setUrl(event.currentTarget.value)}
          />
        </div>

        <div class="field">
          <label for="yp-theme-mode">Apply to</label>
          <select
            id="yp-theme-mode"
            class="input"
            value={state.mode()}
            onChange={(event) => state.setMode(event.currentTarget.value as OnlineThemeMode)}
          >
            <option value="always">Always</option>
            <option value="light">Light theme</option>
            <option value="dark">Dark theme</option>
          </select>
        </div>

        <p class="hint" style={{ margin: '-6px 0 14px' }}>
          Use a direct CSS link from a host in Yapin's CSP allowlist. GitHub raw links
          (raw.githubusercontent.com) work; other hosts may be blocked.
        </p>
      </Show>

      <p class="hint" style={{ margin: '12px 0 0' }}>
        Themes can change Yapin's layout and may cause lag. Only install CSS you trust.
      </p>
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
          Add Theme
        </Button>
      </>
    ),
  });
}
