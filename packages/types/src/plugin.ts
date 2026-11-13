import type { Component, JSX } from 'solid-js';
import type { ButtonProps, HintProps, IconProps, PanelProps } from '@yapmod/ui';

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
  /** A per-plugin object persisted through `flushStorage()`. */
  readonly storage: Record<string, unknown>;
  /** Writes `storage` to `localStorage`. */
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
