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
