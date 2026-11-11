import type { Client, ClientState } from '@yapmod/types';

/**
 * Runs cleanups in order, catching errors so one failure does not prevent
 * the rest from running.
 */
function runCleanups(cleanups: (() => void)[]): void {
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      console.error('[yapmod] cleanup failed', error);
    }
  }
}

/**
 * Creates the client runtime.
 *
 * The runtime is deliberately small: it is the disposal scope of one
 * injected bundle.
 *
 * - `createClient()` initializes it; it starts in the `ready` state.
 * - Features install themselves and register how to undo what they created
 *   with `onDispose()`.
 * - `dispose()` runs every registered cleanup.
 *
 * The runtime owns no DOM of its own. Features attach themselves where the
 * host application expects them (or create their own roots) and register
 * the cleanup that removes all of it again.
 */
export function createClient(): Client {
  const cleanups: (() => void)[] = [];
  let state: ClientState = 'ready';

  return {
    get state() {
      return state;
    },

    onDispose(cleanup) {
      if (state === 'disposed') {
        runCleanups([cleanup]);
        return;
      }
      cleanups.push(cleanup);
    },

    dispose() {
      if (state === 'disposed') return;
      state = 'disposed';
      runCleanups(cleanups.splice(0));
    },
  };
}
