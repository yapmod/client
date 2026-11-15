'use client';

/**
 * Static HTML previews of the @yapmod/ui components for the docs page.
 *
 * The docs app is React + Next.js, while @yapmod/ui is SolidJS. Rendering
 * actual SolidJS components inside a React MDX page is not feasible because
 * Turbopack always uses the React JSX runtime. Instead, these components
 * reproduce the same HTML structure and CSS classes so the preview looks
 * identical to the real components.
 *
 * They use the same .yp-* CSS classes defined in preview.css, so they
 * inherit the exact same styling.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import '@/styles/preview.css';

/* -------------------------------------------------- Chevron SVG -- */

const CHEVRON =
  'M5.3 9.3a1 1 0 0 1 1.4 0L12 14.6l5.3-5.3a1 1 0 1 1 1.4 1.4l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4Z';

const CHECK = (
  <svg className="yp-dd-check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path
      d="m8 12.5 2.6 2.6L16.2 9.4"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* -------------------------------------------------- Select preview -- */

interface PreviewOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * A minimal React recreation of the @yapmod/ui Select dropdown.
 * Uses the same .yp-dd-* CSS classes so it looks identical.
 */
function DropdownSelect({
  options,
  defaultValue,
  placeholder,
  disabled,
}: {
  options: PreviewOption[];
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const toggle = useCallback(() => {
    if (!disabled) setOpen((p) => !p);
  }, [disabled]);

  const select = useCallback((opt: PreviewOption) => {
    if (opt.disabled) return;
    setValue(opt.value);
    setOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`yp-input yp-dd-trigger${open ? ' yp-dd-trigger--open' : ''}`}
        disabled={disabled}
        onClick={toggle}
      >
        <span className={`yp-dd-value${!selectedOption ? ' yp-dd-value--empty' : ''}`}>
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <svg className="yp-dd-chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d={CHEVRON} />
        </svg>
      </button>

      {open && (
        <div
          className="yp-dd-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            marginTop: '4px',
            zIndex: 1000,
          }}
        >
          <div className="yp-dd-list">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`yp-dd-opt${opt.value === value ? ' yp-dd-opt--on' : ''}${opt.disabled ? ' yp-dd-opt--off' : ''}`}
                onMouseEnter={() => {}}
                onClick={() => select(opt)}
              >
                <span className="yp-dd-label">{opt.label}</span>
                {opt.value === value && CHECK}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- Switch preview -- */

export function SwitchPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <span style={{ fontSize: '14px', flex: 1 }}>Notifications</span>
          <input type="checkbox" className="yp-switch" defaultChecked />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <span style={{ fontSize: '14px', flex: 1 }}>Sounds</span>
          <input type="checkbox" className="yp-switch" />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', flex: 1, opacity: 0.5 }}>Disabled</span>
          <input type="checkbox" className="yp-switch" disabled />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Input preview -- */

export function InputPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input className="yp-input" placeholder="Type something…" />
        <input className="yp-input" value="Read only" readOnly />
        <input className="yp-input" value="Disabled" disabled />
      </div>
    </div>
  );
}

/* -------------------------------------------------- Textarea preview -- */

export function TextareaPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea className="yp-input yp-textarea" placeholder="Write some CSS…" rows={3} />
      </div>
    </div>
  );
}

/* -------------------------------------------------- Select preview -- */

const LANG_OPTIONS: PreviewOption[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
];

const MODE_OPTIONS: PreviewOption[] = [
  { value: 'always', label: 'Always' },
  { value: 'light', label: 'Light mode only' },
  { value: 'dark', label: 'Dark mode only' },
  { value: 'legacy', label: 'Legacy', disabled: true },
];

const THEME_OPTIONS: PreviewOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'nord', label: 'Nord' },
  { value: 'gruvbox', label: 'Gruvbox' },
];

export function SelectPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <DropdownSelect options={LANG_OPTIONS} defaultValue="en" />
        <DropdownSelect options={MODE_OPTIONS} placeholder="Pick a mode…" />
        <DropdownSelect options={LANG_OPTIONS} defaultValue="fr" disabled />
      </div>
    </div>
  );
}

/* -------------------------------------------------- Button preview -- */

export function ButtonPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button type="button" className="yp-btn">
          Default
        </button>
        <button type="button" className="yp-btn yp-btn--secondary">
          Secondary
        </button>
        <button type="button" className="yp-btn yp-btn--ghost">
          Ghost
        </button>
        <button type="button" className="yp-btn yp-btn--danger">
          Danger
        </button>
        <button type="button" className="yp-btn yp-btn--small">
          Small
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Panel preview -- */

export function PanelPreview() {
  return (
    <div className="yp-preview">
      <div className="yp-card">
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Card title</div>
        <span className="yp-hint">This is a panel matching Yapin&apos;s card style.</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Hint preview -- */

export function HintPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="yp-hint">This is helper text in Yapin&apos;s hint style.</span>
        <span className="yp-hint" style={{ fontStyle: 'italic' }}>
          It inherits font and adapts to context.
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Icon preview -- */

export function IconPreview() {
  // Inline SVG icons matching the bundled icon set in packages/ui/src/icons.ts
  const icons = [
    {
      name: 'settings',
      paths: [
        {
          d: 'M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
          fillRule: 'evenodd' as const,
        },
      ],
    },
    {
      name: 'puzzle',
      paths: [
        {
          d: 'M18.559 12.8227C17.7884 13.4957 16.6663 13.3616 15.9404 12.641C14.7975 11.5063 11.4931 8.21104 11.4931 8.21104C10.897 7.63087 10.897 6.44662 11.4931 5.85464C12.319 5.03435 13.6053 3.75146 13.6053 3.75146C13.9641 3.39195 14.456 3.18972 14.9653 3.18886L18.3363 3.18425L19.5255 2L22.5 4.96048L21.3108 6.14473L21.3021 9.50878C21.2992 10.0164 21.0967 10.5026 20.735 10.8613C20.735 10.8613 19.5718 11.9384 18.559 12.8227ZM15.2315 13.9548L13.4954 15.8273C14.0972 16.4265 14.0972 16.9113 13.64 17.6997L11.3976 20.2485C11.0359 20.6081 10.5469 20.8103 10.0347 20.8111L6.66378 20.8158L5.47455 22L2.5 19.0395L3.68927 17.8553L3.70082 14.4912C3.70082 13.9836 3.90338 13.4974 4.26507 13.1387L6.37153 11.0404C6.96759 10.4485 8.15685 10.4485 8.73844 11.0404L8.74424 11.0465L10.5295 9.26998L11.7188 10.4542L9.93347 12.2305L12.3119 14.599L14.0972 12.8227L15.2315 13.9548Z',
        },
      ],
    },
    {
      name: 'trash',
      paths: [
        { d: 'M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z' },
        {
          d: 'M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z',
        },
      ],
    },
    {
      name: 'palette',
      paths: [
        {
          d: 'M15.35 7.24C15.9 6.67 16 5.8 16 5a3 3 0 1 1 3 3c-.8 0-1.67.09-2.24.65a1.5 1.5 0 0 0 0 2.11l1.12 1.12a3 3 0 0 1 0 4.24l-5 5a3 3 0 0 1-4.25 0l-5.76-5.75a3 3 0 0 1 0-4.24l4.04-4.04.97-.97a3 3 0 0 1 4.24 0l1.12 1.12c.58.58 1.52.58 2.1 0ZM6.9 9.9 4.3 12.54a1 1 0 0 0 0 1.42l2.17 2.17.83-.84a1 1 0 0 1 1.42 1.42l-.84.83.59.59 1.83-1.84a1 1 0 0 1 1.42 1.42l-1.84 1.83.17.17a1 1 0 0 0 1.42 0l2.63-2.62L6.9 9.9Z',
          fillRule: 'evenodd' as const,
        },
      ],
    },
    {
      name: 'upload',
      paths: [
        {
          d: 'M12 2a1 1 0 0 1 .71.29l4 4a1 1 0 0 1-1.42 1.42L13 5.41V15a1 1 0 1 1-2 0V5.41L8.71 7.71a1 1 0 0 1-1.42-1.42l4-4A1 1 0 0 1 12 2Z',
        },
        {
          d: 'M4 14a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3a1 1 0 1 1 2 0v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3a1 1 0 0 1 1-1Z',
        },
      ],
    },
    {
      name: 'refresh',
      paths: [
        {
          d: 'M4 12a8 8 0 0 1 14.93-4H15a1 1 0 1 0 0 2h6a1 1 0 0 0 1-1V3a1 1 0 1 0-2 0v3a9.98 9.98 0 0 0-18 6 10 10 0 0 0 16.29 7.78 1 1 0 0 0-1.26-1.56A8 8 0 0 1 4 12Z',
        },
      ],
    },
    {
      name: 'plus',
      paths: [{ d: 'M20 14H14V20H10V14H4V10H10V4H14V10H20V14Z' }],
    },
    {
      name: 'pencil',
      paths: [
        {
          d: 'm13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z',
        },
      ],
    },
    {
      name: 'close',
      paths: [
        {
          d: 'M6.4 5A1 1 0 0 0 5 6.4L10.6 12 5 17.6A1 1 0 1 0 6.4 19L12 13.4 17.6 19a1 1 0 0 0 1.4-1.4L13.4 12 19 6.4A1 1 0 0 0 17.6 5L12 10.6 6.4 5Z',
        },
      ],
    },
  ];

  return (
    <div className="yp-preview">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
          gap: '12px',
        }}
      >
        {icons.map((icon) => (
          <div
            key={icon.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="currentColor"
              aria-hidden="true"
            >
              {icon.paths.map((p, j) => {
                const pathProps: { d: string; fillRule?: 'evenodd' | 'nonzero' } = { d: p.d };
                if ('fillRule' in p && p.fillRule) pathProps.fillRule = p.fillRule;
                return <path key={j} {...pathProps} />;
              })}
            </svg>
            <span className="yp-hint" style={{ fontSize: '10px' }}>
              {icon.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------- SettingsPage preview -- */

export function SettingsPagePreview() {
  return (
    <div className="yp-preview">
      <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>My Plugin</h2>
      <span className="yp-hint">Configure my plugin settings</span>
    </div>
  );
}

/* -------------------------------------------------- Section preview -- */

export function SectionPreview() {
  return (
    <div className="yp-preview">
      <div className="yp-section-label">Appearance</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="yp-toggle-row">
          <div>
            <div className="yp-toggle-label">Dark mode</div>
            <span className="yp-hint">Use dark theme</span>
          </div>
          <input type="checkbox" className="yp-switch" defaultChecked />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- SettingRow preview -- */

export function SettingRowPreview() {
  return (
    <div className="yp-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="yp-toggle-row">
          <div>
            <div className="yp-toggle-label">Dark mode</div>
            <span className="yp-hint">Use dark theme</span>
          </div>
          <input type="checkbox" className="yp-switch" defaultChecked />
        </div>
        <div className="yp-toggle-row">
          <div className="yp-toggle-label">Display name</div>
          <input className="yp-input" style={{ width: '180px' }} placeholder="Your name" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- SettingText preview -- */

export function SettingTextPreview() {
  return (
    <div className="yp-preview">
      <div className="yp-toggle-row">
        <div>
          <div className="yp-toggle-label">Version</div>
          <span className="yp-hint">Current version</span>
        </div>
        <span className="yp-hint">v1.0.0</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Divider preview -- */

export function DividerPreview() {
  return (
    <div className="yp-preview">
      <div className="yp-section-label">General</div>
      <div className="yp-toggle-row">
        <div className="yp-toggle-label">Enabled</div>
        <input type="checkbox" className="yp-switch" defaultChecked />
      </div>
      <hr className="yp-divider" />
      <div className="yp-section-label">Info</div>
      <div className="yp-toggle-row">
        <div className="yp-toggle-label">Version</div>
        <span className="yp-hint">v1.0.0</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Full settings example preview -- */

export function SettingsExamplePreview() {
  return (
    <div className="yp-preview">
      <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>My Plugin</h2>
      <span className="yp-hint">Configure my plugin settings</span>

      <div className="yp-section-label">General</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="yp-toggle-row">
          <div>
            <div className="yp-toggle-label">Enabled</div>
            <span className="yp-hint">Toggle the plugin on or off</span>
          </div>
          <input type="checkbox" className="yp-switch" defaultChecked />
        </div>
        <div className="yp-toggle-row">
          <div>
            <div className="yp-toggle-label">Display name</div>
            <span className="yp-hint">Enter your display name</span>
          </div>
          <input className="yp-input" style={{ width: '180px' }} placeholder="Your name" />
        </div>
        <div className="yp-toggle-row">
          <div>
            <div className="yp-toggle-label">Theme</div>
            <span className="yp-hint">Choose a color theme</span>
          </div>
          <DropdownSelect options={THEME_OPTIONS} defaultValue="default" />
        </div>
      </div>

      <hr className="yp-divider" />

      <div className="yp-section-label">Info</div>
      <div className="yp-toggle-row">
        <div>
          <div className="yp-toggle-label">Version</div>
          <span className="yp-hint">Current version</span>
        </div>
        <span className="yp-hint">v1.0.0</span>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button className="yp-btn yp-btn-primary">Save</button>
      </div>
    </div>
  );
}
