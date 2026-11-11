/**
 * Shared public contracts for the Yapmod client runtime.
 *
 * This package holds the small surface that the runtime and the composition
 * root agree on. Implementation details stay in the package that owns them.
 */

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
 * It intentionally reveals nothing about internal implementation details.
 */
export interface ClientHandle {
  /** Version of the loaded client bundle. */
  readonly version: string;
  /** Current lifecycle state of the runtime. */
  readonly state: ClientState;
  /** Disposes the runtime. Safe to call repeatedly. */
  dispose(): void;
}
