import type { Component, JSX } from 'solid-js';

/*
 * UI prop types live in `./ui` and are re-exported here so this package
 * remains the single public surface for plugin authors. The Solid
 * implementation in `packages/ui` imports the same definitions, so the
 * contracts and the components cannot drift apart.
 */

import type {
  IconName,
  IconProps,
  ButtonProps,
  HintProps,
  PanelProps,
  SwitchProps,
  InputProps,
  TextareaProps,
  SelectOption,
  SelectProps,
  SettingsPageProps,
  SectionSpacing,
  SectionProps,
  SettingRowProps,
  SettingTextProps,
  DividerProps,
} from './ui';

export type {
  IconName,
  IconProps,
  ButtonProps,
  HintProps,
  PanelProps,
  SwitchProps,
  InputProps,
  TextareaProps,
  SelectOption,
  SelectProps,
  SettingsPageProps,
  SectionSpacing,
  SectionProps,
  SettingRowProps,
  SettingTextProps,
  DividerProps,
};

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

/** The message selected when its Yapin menu opened. */
export interface MessageMenuContext {
  readonly messageId: string;
}

export interface MessageMenuAction {
  /** Unique within this plugin. */
  id: string;
  label: string;
  icon?: IconName;
  /** Checked when showing and selecting the action. */
  visible?: (context: MessageMenuContext) => boolean;
  onSelect: (context: MessageMenuContext) => void | Promise<void>;
}

export interface PluginContextMenus {
  registerAction(target: 'message', action: MessageMenuAction): () => void;
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

/** Read-only native textarea measurements, in UTF-16 code units. */
export interface ComposerStatusState {
  readonly length: number;
  readonly maxLength: number | null;
}

/** A plain-text indicator, optionally emphasized at a limit. */
export type ComposerStatus = string | { text: string; tone?: 'warning' };

/** A snapshot of the composer where the user activated a tool. */
export interface ComposerToolContext extends ComposerStatusState {
  /** Return keyboard focus to this input while it remains mounted. */
  focus(): void;
}

export interface ComposerTool {
  /** Stable ID scoped to the registering plugin. */
  id: string;
  /** Accessible button name and visible overflow label. */
  label: string;
  /** Choose a built-in icon or render decorative Solid content. */
  icon: IconName | (() => JSX.Element);
  onActivate(context: ComposerToolContext): void | Promise<void>;
}

export interface PluginComposer {
  /** Mount Solid content once per composer. Read the reactive measurements inside JSX. */
  registerBlock(render: (composer: ComposerStatusState) => JSX.Element): () => void;
  /** Format an indicator for each composer. Unregister early with the returned disposer. */
  registerStatus(format: (state: ComposerStatusState) => ComposerStatus): () => void;
  /** Add a tool to each message composer. The returned function removes it early. */
  registerTool(tool: ComposerTool): () => void;
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
  /** Actions in Yapin’s message context menu. */
  readonly contextMenus: PluginContextMenus;
  /** Toasts, modals, stylesheets and Solid components. */
  readonly ui: PluginUi;
  /** Sections in the Yapmod settings group. */
  readonly settings: PluginSettings;
  /** Read-only status indicators in message composers. */
  readonly composer: PluginComposer;
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
