import type { AppContextState, PluginContext, PluginNavigation } from '@yapmod/types';
import { record, runtime, type Runtime } from './host-runtime';
import type { PluginScope } from './scope';

interface Store {
  getState(): unknown;
  useStore: { subscribe(callback: () => void): () => void };
}

const unavailable: AppContextState = Object.freeze({ available: false });

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function read(store: Store): AppContextState {
  try {
    const state = store.getState();
    if (!record(state) || state.booted !== true) return unavailable;
    const ids = [state.activeChannelId, state.activeServerId, state.userId];
    if (!ids.every((id) => id === null || isId(id))) return unavailable;
    const identity = (id: unknown) => (isId(id) ? Object.freeze({ id }) : null);
    return Object.freeze({
      available: true,
      channel: identity(state.activeChannelId),
      server: identity(state.activeServerId),
      user: identity(state.userId),
    });
  } catch {
    return unavailable;
  }
}

function findStore(host: Runtime): Store {
  for (const module of host.c.values()) {
    try {
      const value = module.exports;
      if (
        !record(value) ||
        typeof value.getState !== 'function' ||
        (!record(value.useStore) && typeof value.useStore !== 'function') ||
        typeof (value.useStore as Store['useStore']).subscribe !== 'function'
      )
        continue;
      const state = value.getState();
      if (
        record(state) &&
        'activeChannelId' in state &&
        'activeServerId' in state &&
        'userId' in state &&
        'booted' in state &&
        record(state.channels) &&
        record(state.servers) &&
        record(state.profiles)
      )
        return value as unknown as Store;
    } catch {
      // Ignore unrelated module exports.
    }
  }
  throw new Error('Yapin app store is unavailable.');
}

function equal(a: AppContextState | undefined, b: AppContextState): boolean {
  if (!a || a.available !== b.available) return false;
  return (
    !a.available ||
    !b.available ||
    (a.channel?.id === b.channel?.id && a.server?.id === b.server?.id && a.user?.id === b.user?.id)
  );
}

/** Native actions and state shape verified against Yapin on 2026-11-22. */
export function createAppContext(scope: PluginScope): {
  context: PluginContext;
  navigation: PluginNavigation;
} {
  let active = true;
  scope.onDispose(() => {
    active = false;
  });
  function assertActive(): void {
    if (!active) throw new Error('Plugin app API has been disposed.');
  }
  async function connect() {
    assertActive();
    const host = await runtime();
    assertActive();
    return { host, store: findStore(host) };
  }
  async function navigate(kind: 'channel' | 'server', id: string | null): Promise<void> {
    const { host, store } = await connect();
    assertActive();
    if (!read(store).available) throw new Error('Yapin app context is unavailable.');
    const state = store.getState();
    if (id !== null) {
      const collection = record(state) ? state[kind === 'channel' ? 'channels' : 'servers'] : null;
      if (!record(collection) || !Object.prototype.hasOwnProperty.call(collection, id))
        throw new Error(`Yapin ${kind} is not loaded.`);
      const target = collection[id];
      if (!record(target) || target.id !== id) throw new Error(`Unsupported Yapin ${kind}.`);
    }
    const name = kind === 'channel' ? 'openChannel' : 'openServer';
    // Companion exports distinguish native app actions from unrelated modules.
    const companion = kind === 'channel' ? 'preloadChannel' : 'serverOpenChannel';
    for (const module of host.c.values()) {
      const value = module.exports;
      if (
        record(value) &&
        typeof value[name] === 'function' &&
        typeof value[companion] === 'function'
      ) {
        assertActive();
        await (value[name] as (id: string | null) => unknown).call(value, id);
        return;
      }
    }
    throw new Error('Yapin navigation actions are unavailable.');
  }
  function open(kind: 'channel' | 'server', id: string): Promise<void> {
    if (!isId(id)) return Promise.reject(new TypeError('Expected a non-empty ID.'));
    return navigate(kind, id);
  }
  return {
    context: {
      async getCurrent() {
        const { store } = await connect();
        assertActive();
        return read(store);
      },
      async subscribe(listener) {
        if (typeof listener !== 'function') throw new TypeError('Expected a context listener.');
        const { store } = await connect();
        assertActive();
        let subscribed = true;
        let previous: AppContextState | undefined;
        const notify = () => {
          if (!active || !subscribed) return;
          const next = read(store);
          if (equal(previous, next)) return;
          previous = next;
          try {
            listener(next);
          } catch (error) {
            console.error('[yapmod] context subscription failed', error);
          }
        };
        const unsubscribe = store.useStore.subscribe(notify);
        const remove = () => {
          if (!subscribed) return;
          subscribed = false;
          unsubscribe();
        };
        scope.onDispose(remove);
        notify();
        return remove;
      },
    },
    navigation: {
      openChannel: (id) => open('channel', id),
      openServer: (id) => open('server', id),
      openDirectMessages: () => navigate('server', null),
    },
  };
}
