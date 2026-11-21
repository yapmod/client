import type { CallState, PluginCalls } from '@yapmod/types';
import type { PluginScope } from './scope';

import { record, runtime, type Runtime } from './host-runtime';

interface Store {
  getState(): unknown;
  useStore: { subscribe(callback: () => void): () => void };
}

// Serialize setters across plugins: Yapin only exposes toggles.
let actions: Promise<unknown> = Promise.resolve();

function read(store: Store): CallState | null {
  const state = store.getState();
  if (!record(state) || !('voice' in state)) throw new Error('Unsupported Yapin call state.');
  const voice = state.voice;
  if (voice === null) return null;
  if (
    !record(voice) ||
    typeof voice.channelId !== 'string' ||
    typeof voice.muted !== 'boolean' ||
    typeof voice.deafened !== 'boolean' ||
    (voice.serverId !== undefined && typeof voice.serverId !== 'string')
  )
    throw new Error('Unsupported Yapin call state.');
  return Object.freeze({
    channelId: voice.channelId,
    ...(voice.serverId === undefined ? {} : { serverId: voice.serverId }),
    muted: voice.muted,
    deafened: voice.deafened,
  });
}

function findStore(host: Runtime): Store {
  for (const module of host.c.values()) {
    const value = module.exports;
    if (
      !record(value) ||
      typeof value.getState !== 'function' ||
      (!record(value.useStore) && typeof value.useStore !== 'function')
    )
      continue;
    const store = value as unknown as Store;
    if (typeof store.useStore.subscribe !== 'function') continue;
    try {
      const state = store.getState();
      if (
        !record(state) ||
        !('voice' in state) ||
        !record(state.voiceMembers) ||
        !record(state.speaking) ||
        !record(state.profiles)
      )
        continue;
      read(store);
      return store;
    } catch {
      /* Unrelated exports must not prevent discovery. */
    }
  }
  throw new Error('Yapin call store is unavailable.');
}

function equal(a: CallState | null, b: CallState | null): boolean {
  return (
    a === b ||
    (a !== null &&
      b !== null &&
      a.channelId === b.channelId &&
      a.serverId === b.serverId &&
      a.muted === b.muted &&
      a.deafened === b.deafened)
  );
}

export function createCalls(scope: PluginScope): PluginCalls {
  let active = true;
  scope.onDispose(() => {
    active = false;
  });
  function assertActive(): void {
    if (!active) throw new Error('Plugin call API has been disposed.');
  }
  async function connect() {
    assertActive();
    const host = await runtime();
    assertActive();
    return { host, store: findStore(host) };
  }
  function perform(
    expected: CallState,
    key: 'muted' | 'deafened' | 'leave',
    desired?: boolean,
  ): Promise<void> {
    if (
      !expected ||
      typeof expected.channelId !== 'string' ||
      (expected.serverId !== undefined && typeof expected.serverId !== 'string')
    )
      return Promise.reject(new TypeError('A call snapshot is required.'));
    if (key !== 'leave' && typeof desired !== 'boolean')
      return Promise.reject(new TypeError('Call setters expect a boolean.'));
    const channelId = expected.channelId;
    const serverId = expected.serverId;
    const result = actions.then(async () => {
      const { host, store } = await connect();
      assertActive();
      const current = read(store);
      if (!current || current.channelId !== channelId || current.serverId !== serverId)
        throw new Error('The selected call is no longer current.');
      if (key !== 'leave' && current[key] === desired) return;
      const name =
        key === 'muted' ? 'toggleMute' : key === 'deafened' ? 'toggleDeafen' : 'leaveVoice';
      for (const module of host.c.values()) {
        const value = module.exports;
        if (
          !record(value) ||
          typeof value.toggleMute !== 'function' ||
          typeof value.toggleDeafen !== 'function' ||
          typeof value.leaveVoice !== 'function'
        )
          continue;
        await (value[name] as () => unknown).call(value);
        return;
      }
      throw new Error('Yapin call controls are unavailable.');
    });
    actions = result.catch(() => {});
    return result;
  }
  return {
    async getCurrent() {
      const { store } = await connect();
      assertActive();
      return read(store);
    },
    async subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Expected a call listener.');
      const { store } = await connect();
      assertActive();
      let subscribed = true;
      let initialized = false;
      let previous: CallState | null = null;
      const notify = () => {
        if (!active || !subscribed) return;
        try {
          const next = read(store);
          if (initialized && equal(previous, next)) return;
          initialized = true;
          previous = next;
          listener(next);
        } catch (error) {
          console.error('[yapmod] call subscription failed', error);
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
    setMuted: (muted, expected) => perform(expected, 'muted', muted),
    setDeafened: (deafened, expected) => perform(expected, 'deafened', deafened),
    leave: (expected) => perform(expected, 'leave'),
  };
}
