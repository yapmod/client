/**
 * Plugin-facing contracts.
 *
 * These types are the single source of truth for the plugin API: the runtime
 * implements them and the builder ships them to plugin authors, so both sides
 * always agree on the surface.
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
