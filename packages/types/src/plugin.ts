import type { Component, JSX } from 'solid-js';

/*
 * UI prop types live in `./ui` and are re-exported here so this package
 * remains the single public surface for plugin authors. The Solid
 * implementation in `packages/ui` imports the same definitions, so the
 * contracts and the components cannot drift apart.
 */

import type {
  IconName,
  IconSource,
  IconDefinition,
  IconPath,
  RegisteredIcon,
  IconProps,
  ButtonProps,
  BadgeProps,
  IconButtonProps,
  TabsProps,
  HintProps,
  PanelProps,
  SwitchProps,
  InputProps,
  SliderProps,
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
  IconSource,
  IconDefinition,
  IconPath,
  RegisteredIcon,
  IconProps,
  ButtonProps,
  BadgeProps,
  IconButtonProps,
  TabsProps,
  HintProps,
  PanelProps,
  SwitchProps,
  InputProps,
  SliderProps,
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

/** Context captured from the current host chat. */
export interface ChatLocationContext {
  /** Host chat identifier; may identify a channel or direct conversation. */
  readonly chatId: string;
}

export interface LocationAction<C> {
  id: string;
  label: string;
  icon?: IconSource;
  visible?: (context: C) => boolean;
  onSelect: (context: C) => void | Promise<void>;
}

export interface ChannelMenuContext {
  readonly channelId: string;
}
export interface UserMenuContext {
  readonly userId: string;
}
export interface DockedPanelOptions {
  id: string;
  title: string;
  render: (context: ChatLocationContext, close: () => void) => JSX.Element;
}

export interface PluginUiExtensions {
  /** Current chat header. Missing host anchors leave the registration dormant. */
  registerHeaderAction(action: LocationAction<ChatLocationContext>): () => void;
  /** Entries at the end of the channel sidebar's scroll area. */
  registerSidebarEntry(action: LocationAction<Readonly<Record<string, never>>>): () => void;
  /** Opens a chat-scoped panel deliberately. Closes on navigation or plugin disposal. */
  openPanel(options: DockedPanelOptions): () => void;
}

/** Shared UI helpers; plugin-owned locations are in PluginUiExtensions. */
export interface PluginUi {
  /**
   * Registers SVG data under a name local to this plugin setup. Duplicate names throw.
   * References expire when the plugin stops; expired references render the puzzle icon.
   */
  registerIcon(name: string, definition: IconDefinition): RegisteredIcon;
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
  Badge: Component<BadgeProps>;
  IconButton: Component<IconButtonProps>;
  Tabs: <Value extends string>(props: TabsProps<Value>) => JSX.Element;
  /** Inline hint text in Yapin's `.hint` style. */
  Hint: Component<HintProps>;
  /** A card-like container in Yapmod's `yp-` style. */
  Panel: Component<PanelProps>;
  /** An inline SVG icon from the built-in set or a registered definition. */
  Icon: Component<IconProps>;
  /** A toggle switch matching Yapin's `.switch` style. */
  Switch: Component<SwitchProps>;
  Slider: Component<SliderProps>;
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
  icon?: IconSource;
  /** Solid content rendered into the section's panel. */
  render: () => JSX.Element;
}

/** Detached attachment metadata. Path is the host storage path, not a URL. */
export interface MessageAttachment {
  readonly path: string;
  readonly name?: string;
  /** Byte count and pixel dimensions, when available. */
  readonly size?: number;
  readonly width?: number;
  readonly height?: number;
}

/** Only validated fields present in the loaded host record are exposed. */
export interface LoadedMessage {
  readonly id: string;
  readonly text?: string;
  readonly authorId?: string;
  readonly channelId?: string;
  /** Host timestamp string, with its original precision and timezone. */
  readonly createdAt?: string;
  /** Undefined means unknown; an empty array means the host reports no attachment. */
  readonly attachments?: readonly MessageAttachment[];
}

export type LoadedMessageResult =
  | { readonly status: 'found'; readonly message: LoadedMessage }
  | { readonly status: 'not-loaded' }
  | { readonly status: 'unavailable' };

export interface PluginMessages {
  /** Reads the host cache only. A cache miss does not mean deleted or nonexistent.
   * Unavailable means discovery, host access or record validation failed.
   * Invalid IDs and calls after plugin disposal reject.
   */
  getLoaded(messageId: string): Promise<LoadedMessageResult>;
}

/** The message selected when its Yapin menu opened. */
export interface MessageMenuContext {
  readonly messageId: string;
}

export interface MessageMenuAction {
  /** Unique within this plugin. */
  id: string;
  label: string;
  icon?: IconSource;
  /** Checked when showing and selecting the action. */
  visible?: (context: MessageMenuContext) => boolean;
  onSelect: (context: MessageMenuContext) => void | Promise<void>;
}

export interface ContextMenuTargets {
  message: MessageMenuContext;
  channel: ChannelMenuContext;
  /** Member-list context menus only. */
  user: UserMenuContext;
}

export interface PluginContextMenus {
  registerAction<K extends keyof ContextMenuTargets>(
    target: K,
    action: LocationAction<ContextMenuTargets[K]>,
  ): () => void;
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

/** An insertion failure leaves the draft untouched. */
export type ComposerInsertResult =
  | { ok: true }
  | { ok: false; reason: 'stale-target' | 'draft-changed' | 'max-length' | 'not-editable' };

/** A snapshot of the composer where the user activated a tool. */
export interface ComposerToolContext extends ComposerStatusState {
  /** Immutable activation snapshot, never a live draft reader. */
  readonly draft: string;
  /** UTF-16 offsets, matching textarea selection and String.slice. */
  readonly selection: { readonly start: number; readonly end: number };
  /** Yapin conversation ID (also used for DMs/groups); null when unverified. */
  readonly channelId: string | null;
  /** Replace the captured selection using the same guards as insertText. */
  replaceSelection(text: string): ComposerInsertResult;
  /** Replace the entire captured draft using the same guards as insertText. */
  replaceDraft(text: string): ComposerInsertResult;
  /** Return keyboard focus to this input while it remains mounted. */
  focus(): void;
  /** Replace the captured selection, preserving surrounding text. Never sends a message.
   * Rejects changed drafts and stale targets; activate again to capture a fresh draft.
   */
  insertText(text: string): ComposerInsertResult;
}

export interface ComposerTool {
  /** Stable ID scoped to the registering plugin. */
  id: string;
  /** Accessible button name and visible overflow label. */
  label: string;
  /** Choose a built-in or registered icon, or render decorative Solid content. */
  icon: IconSource | (() => JSX.Element);
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
/** Arguments are raw text after the command name, trimmed at both ends. */
export interface CommandContext {
  /** Captured Yapin conversation ID (including DMs/groups); null when unverified. */
  readonly channelId: string | null;
  readonly args: string;
  /** Aborted when the command is unregistered or the plugin stops. */
  readonly signal: AbortSignal;
}

export interface PluginCommand {
  /** Unique lowercase name, 1–32 letters, digits, underscores or hyphens; omit /. */
  readonly name: string;
  /** Non-empty suggestion description, at most 200 characters. */
  readonly description: string;
  execute(context: CommandContext): void | Promise<void>;
}

export interface PluginCommands {
  /** Register a local slash command. Returns an idempotent disposer. */
  register(command: PluginCommand): () => void;
}

/** Detached snapshot of the local user's current voice call. */
export interface CallState {
  readonly channelId: string;
  readonly serverId?: string;
  /** The microphone mute flag; deafening can also suppress microphone audio. */
  readonly muted: boolean;
  readonly deafened: boolean;
}

export interface PluginCalls {
  /** Null means no call. Rejects when Yapin's internal API is unavailable. */
  getCurrent(): Promise<CallState | null>;
  /** Emits immediately, then on changes. Automatically removed when the plugin stops. */
  subscribe(listener: (call: CallState | null) => void): Promise<() => void>;
  /** Setters reject if the snapshot's channel/server is no longer current. */
  setMuted(muted: boolean, expected: CallState): Promise<void>;
  setDeafened(deafened: boolean, expected: CallState): Promise<void>;
  leave(expected: CallState): Promise<void>;
}

/** Detached identity of a selected host entity. No host objects are exposed. */
export interface AppContextIdentity {
  readonly id: string;
}

/** Null is a known empty selection; unavailable is never represented as null. */
export type AppContextState =
  | { readonly available: false }
  | {
      readonly available: true;
      /** Includes existing direct/group conversations and threads. */
      readonly channel: AppContextIdentity | null;
      readonly server: AppContextIdentity | null;
      readonly user: AppContextIdentity | null;
    };

export interface PluginContext {
  /** Rejects if the host runtime/store cannot be discovered. */
  getCurrent(): Promise<AppContextState>;
  /** Emits immediately and on changes, including unavailable state. Lifecycle-owned. */
  subscribe(listener: (context: AppContextState) => void): Promise<() => void>;
}

export interface PluginNavigation {
  /** Opens an existing loaded channel/conversation using Yapin's native action. */
  openChannel(id: string): Promise<void>;
  /** Opens a loaded server and lets Yapin choose its channel or lobby. */
  openServer(id: string): Promise<void>;
  /** Opens the direct-messages area without creating a conversation. */
  openDirectMessages(): Promise<void>;
}

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
  /** Local slash commands in message composers; cleaned up when the plugin stops. */
  readonly commands: PluginCommands;
  /** Current voice call state and controls. */
  readonly calls: PluginCalls;
  /** Detached reads of messages already loaded by Yapin; never fetches history. */
  readonly messages: PluginMessages;
  readonly context: PluginContext;
  readonly navigation: PluginNavigation;
  /** Toasts, modals, stylesheets and Solid components. */
  readonly ui: PluginUi & PluginUiExtensions;
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
