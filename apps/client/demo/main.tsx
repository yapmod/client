import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { Input, Select, Switch, injectStyles } from '@yapmod/ui';

injectStyles();

const THEMES = {
  dark: {
    '--bg-main': '#222329',
    '--bg-side': '#1b1c21',
    '--bg-elev': '#2b2c33',
    '--bg-hover': '#2f3038',
    '--bg-active': '#383944',
    '--bg-input': '#2d2e36',
    '--bg-rail': '#141519',
    '--bg-float': '#1b1c21',
    '--text': '#ececf1',
    '--text-muted': '#a6a7b4',
    '--text-faint': '#9a9ca9',
    '--border': '#ffffff12',
    '--accent': '#ff6b4a',
    '--accent-hover': '#ff5a35',
    '--accent-fill': '#d4401e',
    '--on-accent': '#ffffff',
    '--success': '#3fcf82',
    '--shadow': '0 10px 40px #00000073',
    'color-scheme': 'dark',
  },
  light: {
    '--bg-main': '#ffffff',
    '--bg-side': '#f2f3f5',
    '--bg-elev': '#ebedef',
    '--bg-hover': '#e6e7ea',
    '--bg-active': '#d7d9de',
    '--bg-input': '#ebedef',
    '--bg-rail': '#e3e5e8',
    '--bg-float': '#ffffff',
    '--text': '#1d1f23',
    '--text-muted': '#55575f',
    '--text-faint': '#5f616a',
    '--border': '#00000017',
    '--accent': '#d4401e',
    '--accent-hover': '#bf3618',
    '--accent-fill': '#d4401e',
    '--on-accent': '#ffffff',
    '--success': '#177245',
    '--shadow': '0 10px 34px #00000029',
    'color-scheme': 'light',
  },
} as const;

type ThemeName = keyof typeof THEMES;

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ja', label: '日本語' },
  { value: 'old', label: 'Legacy (unavailable)', disabled: true },
];

const AUDIENCE = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'servers', label: 'People in my servers and friends' },
  { value: 'friends', label: 'Friends only' },
  { value: 'nobody', label: 'Nobody' },
];

/** Applies one of Yapin's palettes to the page. */
function applyTheme(name: ThemeName) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(THEMES[name])) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', name);
}

function Demo() {
  const [theme, setTheme] = createSignal<ThemeName>('dark');
  const [notifications, setNotifications] = createSignal(true);
  const [sounds, setSounds] = createSignal(false);
  const [developer, setDeveloper] = createSignal(true);
  const [handle, setHandle] = createSignal('');
  const [language, setLanguage] = createSignal('en');
  const [audience, setAudience] = createSignal('servers');

  applyTheme(theme());

  return (
    <div class="settings" style={{ background: 'var(--bg-main)', 'min-height': '100vh' }}>
      <div class="ss2" style={{ 'max-width': '720px', margin: '0 auto', padding: '32px 20px' }}>
        <header
          style={{ display: 'flex', 'align-items': 'center', gap: '12px', 'margin-bottom': '24px' }}
        >
          <h1 style={{ margin: '0', 'font-size': '22px' }}>Yapmod components</h1>
          <button
            type="button"
            class="btn"
            style={{
              'margin-left': 'auto',
              padding: '8px 14px',
              border: '1px solid var(--border)',
              'border-radius': '8px',
              background: 'var(--bg-active)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            onClick={() => {
              const next = theme() === 'dark' ? 'light' : 'dark';
              setTheme(next);
              applyTheme(next);
            }}
          >
            {theme() === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </header>

        <section class="ss2-card" style={{ 'margin-bottom': '20px' }}>
          <div
            class="section-label"
            style={{ 'font-size': '12px', 'letter-spacing': '.08em', color: 'var(--text-muted)' }}
          >
            SWITCH
          </div>

          <label
            class="toggle-row"
            style={{ display: 'flex', 'align-items': 'center', gap: '16px', padding: '12px 0' }}
          >
            <div style={{ flex: '1' }}>
              <div class="toggle-label" style={{ 'font-weight': '600' }}>
                Comment notifications
              </div>
              <div class="hint" style={{ 'font-size': '13px', color: 'var(--text-muted)' }}>
                Shows new comments on your profile in your inbox.
              </div>
            </div>
            <Switch checked={notifications()} onChange={setNotifications} />
          </label>

          <label
            class="toggle-row"
            style={{ display: 'flex', 'align-items': 'center', gap: '16px', padding: '12px 0' }}
          >
            <div style={{ flex: '1' }}>
              <div class="toggle-label" style={{ 'font-weight': '600' }}>
                Notification sounds
              </div>
              <div class="hint" style={{ 'font-size': '13px', color: 'var(--text-muted)' }}>
                Plays a sound when a message arrives.
              </div>
            </div>
            <Switch checked={sounds()} onChange={setSounds} />
          </label>

          <label
            class="toggle-row"
            style={{ display: 'flex', 'align-items': 'center', gap: '16px', padding: '12px 0' }}
          >
            <div style={{ flex: '1' }}>
              <div class="toggle-label" style={{ 'font-weight': '600' }}>
                Developer features
              </div>
              <div class="hint" style={{ 'font-size': '13px', color: 'var(--text-muted)' }}>
                Accept hot updates from a local dev server.
              </div>
            </div>
            <Switch checked={developer()} onChange={setDeveloper} />
          </label>

          <label
            class="toggle-row"
            style={{ display: 'flex', 'align-items': 'center', gap: '16px', padding: '12px 0' }}
          >
            <div style={{ flex: '1' }}>
              <div class="toggle-label" style={{ 'font-weight': '600' }}>
                Quiet hours
              </div>
              <div class="hint" style={{ 'font-size': '13px', color: 'var(--text-muted)' }}>
                A disabled switch cannot be toggled.
              </div>
            </div>
            <Switch disabled />
          </label>

          <div
            class="hint"
            style={{ 'font-size': '13px', color: 'var(--text-muted)', 'padding-top': '8px' }}
          >
            State: notifications={String(notifications())}, sounds={String(sounds())}, developer=
            {String(developer())}
          </div>
        </section>

        <section class="ss2-card" style={{ 'margin-bottom': '20px' }}>
          <div
            class="section-label"
            style={{ 'font-size': '12px', 'letter-spacing': '.08em', color: 'var(--text-muted)' }}
          >
            INPUT
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Handle</span>
              <Input
                placeholder="e.g. Antic983 (without the @)"
                value={handle()}
                onChange={setHandle}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Read only</span>
              <Input value="yapmod" readonly />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Disabled</span>
              <Input value="Cannot be edited" disabled />
            </label>

            <div class="hint" style={{ 'font-size': '13px', color: 'var(--text-muted)' }}>
              Handle: {handle() || '(empty)'}
            </div>
          </div>
        </section>

        <section class="ss2-card">
          <div
            class="section-label"
            style={{ 'font-size': '12px', 'letter-spacing': '.08em', color: 'var(--text-muted)' }}
          >
            SELECT
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Language</span>
              <Select options={LANGUAGES} value={language()} onChange={setLanguage} />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Who can send you a direct message</span>
              <Select options={AUDIENCE} value={audience()} onChange={setAudience} />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Nothing selected yet</span>
              <Select options={AUDIENCE} placeholder="Pick an option" />
            </label>

            <label style={{ display: 'grid', gap: '6px' }}>
              <span style={{ 'font-weight': '600' }}>Disabled</span>
              <Select options={AUDIENCE} value="servers" disabled />
            </label>

            <div class="hint" style={{ 'font-size': '13px', color: 'var(--text-muted)' }}>
              Language: {language()} · Audience: {audience()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

render(() => <Demo />, document.getElementById('root')!);
