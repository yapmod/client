/**
 * Shared public contracts for the Yapmod client runtime.
 *
 * This package holds the small surface that the runtime and the composition
 * root agree on. Implementation details stay in the package that owns them.
 */

import type { SharedSolid } from './plugin';

/** Lifecycle states of the client runtime. */
export type ClientState = 'ready' | 'disposed';

/**
 * The client runtime, created through `createClient()` in `@yapmod/core`.
 *
 * The runtime is the disposal scope of one injected bundle: features run
 * their setup, register how to undo it with `onDispose()`, and `dispose()`
 * runs every registered cleanup.
 */
export interface Client {
  /** Current lifecycle state. */
  readonly state: ClientState;
  /**
   * Registers a cleanup that runs when the client is disposed. If the
   * client is already disposed, the cleanup runs immediately.
   */
  onDispose(cleanup: () => void): void;
  /** Disposes the runtime and everything registered on it. Safe to call repeatedly. */
  dispose(): void;
}

/**
 * The minimal handle exposed on `globalThis.YapmodClient`.
 *
 * Beyond lifecycle it deliberately reveals little about internal
 * implementation details — the one exception is `api`, the shared SolidJS
 * instances embedders need to render into this bundle's reactive world.
 */
export interface ClientHandle {
  /** Version of the loaded client bundle. */
  readonly version: string;
  /** Current lifecycle state of the runtime. */
  readonly state: ClientState;
  /**
   * The bundle's shared SolidJS instances. The same references are offered
   * to plugins as `yapmod.solid`, `yapmod.solidWeb` and `yapmod.solidStore`.
   */
  readonly api: SharedSolid;
  /** Disposes the runtime. Safe to call repeatedly. */
  dispose(): void;
}
