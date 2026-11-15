import type { Component, JSX } from 'solid-js';

/*
 * Inline UI prop types.
 *
 * These mirror the prop shapes from @yapmod/ui so this package remains a
 * pure-types dependency with no runtime coupling to the UI component library.
 */

/** Names of the built-in icons. */
export type IconName =
  | 'settings'
  | 'puzzle'
  | 'trash'
  | 'palette'
  | 'upload'
  | 'refresh'
  | 'plus'
  | 'pencil'
  | 'close';

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'default' | 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'medium' | 'small';
};

export type HintProps = JSX.IntrinsicElements['span'];

export type PanelProps = JSX.IntrinsicElements['div'];

export type IconProps = {
  name: IconName;
  size?: number;
  label?: string;
  class?: string;
};

export type SwitchProps = Omit<JSX.IntrinsicElements['input'], 'type' | 'checked' | 'onChange'> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
};

export type InputProps = Omit<JSX.IntrinsicElements['input'], 'value' | 'onChange'> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export type TextareaProps = Omit<JSX.IntrinsicElements['textarea'], 'value' | 'onChange'> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectProps = {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  class?: string;
  classList?: Record<string, boolean | undefined>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

export interface SettingsPageProps {
  title: string;
  description?: string;
  children: JSX.Element;
}

export type SectionSpacing = 'normal' | 'large';

export interface SectionProps {
  label: string;
  children: JSX.Element;
  spacing?: SectionSpacing;
}

export interface SettingRowProps {
  label: string;
  hint?: string | JSX.Element;
  children: JSX.Element;
}

export interface SettingTextProps {
  label: string;
  hint?: string;
  value: string | JSX.Element;
}

/** A horizontal separator component that takes no props. */
export type DividerProps = {};

/*
 * Plugin-facing contracts: the single source of truth for the plugin API.
 * The runtime implements these types and the builder ships them to plugin
 * authors, so both sides always agree on the surface.
 */

/** A function a plugin may export as one of its lifecycle hooks. */
export type PluginFunction = (...args: unknown[]) => unknown;

/** The user-facing metadata every installed plugin carries. */
export interface PluginManifest {
  name: string;
  author: string;
  description: string;
  version?: string;
  hash?: string;
}

/** Message kinds `ui.showToast` understands. */
export type ToastKind = 'success' | 'error';

/** Options accepted by `ui.openModal`. */
export interface PluginModalOptions {
  title: string;
  description?: string;
  wide?: boolean;
  /** Builds the modal body; `close` closes the modal. */
  content: (close: () => void) => JSX.Element;
  /** Builds the modal footer. */
  footer?: (close: () => void) => JSX.Element;
  /** Runs once when the modal closes. */
  onClose?: () => void;
}

/** UI helpers and Solid components available to every plugin. */
export interface PluginUi {
  /** Shows a short-lived message over the page. */
  showToast(message: string, kind?: ToastKind): void;
  /**
   * Opens a modal in Yapin's own style. Returns a close function; the modal
   * also closes when the plugin stops.
   */
  openModal(options: PluginModalOptions): () => void;
  /**
   * Injects a stylesheet into the page. Returns a disposer that removes it
   * again; it also runs when the plugin stops.
   */
  injectCss(css: string): () => void;
  /** A button styled like Yapin's `.btn`. */
  Button: Component<ButtonProps>;
  /** Inline hint text in Yapin's `.hint` style. */
  Hint: Component<HintProps>;
  /** A card-like container in Yapmod's `yp-` style. */
  Panel: Component<PanelProps>;
  /** An inline SVG icon from Yapmod's built-in set. */
  Icon: Component<IconProps>;
  /** A toggle switch matching Yapin's `.switch` style. */
  Switch: Component<SwitchProps>;
  /** A single-line text field matching Yapin's `.input` style. */
  Input: Component<InputProps>;
  /** A multi-line text field matching Yapin's `textarea.input` style. */
  Textarea: Component<TextareaProps>;
  /** A dropdown matching Yapin's `.dd-trigger` and `.dd-menu` style. */
  Select: Component<SelectProps>;
  /** Top-level wrapper for a settings page with title and description. */
  SettingsPage: Component<SettingsPageProps>;
  /** Grouped block with a section heading. */
  Section: Component<SectionProps>;
  /** A single setting row with label, hint, and control. */
  SettingRow: Component<SettingRowProps>;
  /** A read-only setting row that displays a text value. */
  SettingText: Component<SettingTextProps>;
  /** Horizontal separator between sections. */
  Divider: Component<DividerProps>;
}

/** A settings section a plugin registers inside the Yapmod settings group. */
export interface PluginSettingsSection {
  /** Stable id, unique within the plugin. Yapmod namespaces it per plugin. */
  id: string;
  /** Label shown in Yapin's settings navigation. */
  label: string;
  /** Icon rendered in front of the label. */
  icon?: IconName;
  /** Solid content rendered into the section's panel. */
  render: () => JSX.Element;
}

/** The settings hooks on the plugin API. */
export interface PluginSettings {
  /**
   * Adds a section to the Yapmod settings group, below Yapmod's own entries.
   * The section unregisters when the plugin stops. Returns a disposer that
   * removes it early.
   */
  registerSection(section: PluginSettingsSection): () => void;
}

/**
 * The bundle's single copy of SolidJS, exposed as three module objects.
 *
 * The same references are shared by `YapmodClient.api` and the plugin API
 * (`yapmod.solid`, `yapmod.solidWeb`, `yapmod.solidStore`), so everything on
 * the page reacts to the same signals.
 */
export interface SharedSolid {
  /** `solid-js`: signals, effects, control flow. */
  solid: typeof import('solid-js');
  /** `solid-js/web`: `render`, portals, DOM helpers. */
  solidWeb: typeof import('solid-js/web');
  /** `solid-js/store`: `createStore`, `unwrap`. */
  solidStore: typeof import('solid-js/store');
}

/** The API object every started plugin receives, community or client-registered. */
export interface YapmodPluginApi {
  /** API contract version. Plugins can check this before using v1 features. */
  readonly apiVersion: 1;
  /** Stable id of this plugin, also used as its storage key. */
  readonly id: string;
  /** Metadata from `plugin.json` or the local plugin form. */
  readonly manifest: PluginManifest;
  /**
   * Reactive per-plugin storage, backed by a Solid signal. Top-level sets
   * (`storage.count = 1`) persist automatically; deeper mutations are
   * written by `flushStorage()`.
   */
  readonly storage: Record<string, unknown>;
  /** Writes `storage` to `localStorage`. Call it after mutating nested values. */
  flushStorage(): void;
  /** Logs to the console with a `[yapmod:<id>]` prefix. */
  log(...args: unknown[]): void;
  /**
   * Calls `onFound` for every element matching `selector`: the ones already
   * in the page immediately, later ones as they appear. Returns a disposer
   * that stops the observer; it also runs when the plugin stops.
   */
  observe(selector: string, onFound: (element: Element) => void): () => void;
  /** Toasts, modals, stylesheets and Solid components. */
  readonly ui: PluginUi;
  /** Sections in the Yapmod settings group. */
  readonly settings: PluginSettings;
  /** Registers a cleanup that runs when the plugin stops or Yapmod unloads. */
  onDispose(dispose: () => void): void;
  /** Opens the plugin's settings modal, when it exported `settings`. */
  showSettings(): void;
  /** The bundle's shared `solid-js` instance. Never bundle your own copy. */
  readonly solid: SharedSolid['solid'];
  /** The bundle's shared `solid-js/web` instance. */
  readonly solidWeb: SharedSolid['solidWeb'];
  /** The bundle's shared `solid-js/store` instance. */
  readonly solidStore: SharedSolid['solidStore'];
}
