/** A function a plugin may export as one of its lifecycle hooks. */
export type PluginFunction = (...args: unknown[]) => unknown;

/** The API object every started plugin receives, community or client-registered. */
export interface YapmodPluginApi {
  /** Stable id of this plugin, also used as its storage key. */
  readonly id: string;
  /** Metadata from `plugin.json` or the local plugin form. */
  readonly manifest: PluginManifest;
  /** A per-plugin object persisted through `flushStorage()`. */
  readonly storage: Record<string, unknown>;
  /** Writes `storage` to `localStorage`. */
  flushStorage(): void;
  /** Registers a cleanup that runs when the plugin stops or Yapmod unloads. */
  onDispose(dispose: () => void): void;
  /** Opens the plugin's settings modal, when it exported `settings`. */
  showSettings(): void;
}

/** The user-facing metadata every installed plugin carries. */
export interface PluginManifest {
  name: string;
  author: string;
  description: string;
  version?: string;
  hash?: string;
}

/**
 * A plugin installed in this browser.
 *
 * Remote plugins are fetched from a folder containing `plugin.json` and
 * `plugin.js`; local plugins keep their JavaScript inline. `id` is stable for
 * the lifetime of the record, so editing a plugin never moves its settings or
 * storage.
 */
export interface StoredPlugin {
  id: string;
  local: boolean;
  on: boolean;
  /** Whether remote plugins should be refreshed when the page loads. */
  update: boolean;
  /** Base URL of a remote plugin, always ending in `/`. */
  src?: string;
  js: string;
  manifest: PluginManifest;
}

/** Everything the plugin manager persists between page loads. */
export interface PluginState {
  plugins: StoredPlugin[];
}

/**
 * What a client-registered plugin's `setup()` returns.
 *
 * The same optional hooks a community plugin module exports, minus the
 * free-form module shape: client plugin code is typed, so the hooks are
 * declared.
 */
export interface ClientPluginModule {
  onLoad?: PluginFunction;
  onUnload?: PluginFunction;
  settings?: unknown;
}

/**
 * A plugin provided by the application that embeds Yapmod.
 *
 * Client-registered plugins live in the host application's codebase, not in
 * Yapmod, and are registered in code through `YapmodClient.registerClientPlugin()`
 * instead of being imported through the plugin manager. They share the
 * community plugin API, storage and lifecycle, but are never stored as
 * `StoredPlugin` records and cannot be fetched, edited, updated or deleted.
 * Their id is reserved with the `client:` prefix so it can never collide
 * with a local or remote plugin id.
 */
export interface ClientPlugin {
  /** Reserved id, always starting with `client:`. */
  id: string;
  /** Metadata shown on the plugin's card. */
  manifest: PluginManifest;
  /** Whether the plugin starts when the user has made no explicit choice. Defaults to `true`. */
  defaultEnabled?: boolean;
  /**
   * Creates the plugin module. Runs synchronously in the page realm — the
   * host application's own code, so no `eval` or inline script is involved.
   */
  setup(api: YapmodPluginApi): ClientPluginModule;
}
