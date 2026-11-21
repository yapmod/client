import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('current call discovery, controls, subscriptions and disposal', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());
  t.after(() => Reflect.deleteProperty(globalThis, 'TURBOPACK'));
  const { createCalls } = await server.ssrLoadModule('/src/features/plugins/calls.ts');
  const { PluginScope } = await server.ssrLoadModule('/src/features/plugins/scope.ts');
  const scope = new PluginScope(false);
  t.after(() => scope.dispose());
  const api = createCalls(scope);
  globalThis.TURBOPACK = [];
  await assert.rejects(api.getCurrent(), /not ready/);
  globalThis.TURBOPACK = {
    push() {
      throw new Error('discovery failure');
    },
  };
  await assert.rejects(api.getCurrent(), /discovery failure/);
  let voice = null;
  const listeners = new Set();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  const store = {
    getState: () => ({ voice, voiceMembers: {}, profiles: {}, speaking: {} }),
    useStore: Object.assign(() => {}, {
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    }),
  };
  let toggles = 0;
  let leaves = 0;
  let fail = false;
  const controls = {
    async toggleMute() {
      if (fail) throw new Error('Host failure');
      toggles++;
      voice = { ...voice, muted: !voice.muted };
      emit();
    },
    toggleDeafen() {
      voice = { ...voice, deafened: !voice.deafened };
      emit();
    },
    leaveVoice() {
      leaves++;
      voice = null;
      emit();
    },
  };
  const host = {
    c: new Map([
      [1, { exports: store }],
      [2, { exports: controls }],
    ]),
  };
  let boot;
  globalThis.TURBOPACK = {
    push(chunk) {
      if (typeof chunk[2] === 'function') boot = chunk[2];
      else boot(host);
    },
  };
  assert.equal(await api.getCurrent(), null);
  const seen = [];
  const remove = await api.subscribe((value) => seen.push(value));
  assert.deepEqual(seen, [null]);
  voice = { channelId: 'one', serverId: 'server', muted: false, deafened: false };
  emit();
  emit();
  assert.equal(seen.length, 2);
  const call = await api.getCurrent();
  assert.equal(Object.isFrozen(call), true);
  const otherScope = new PluginScope(false);
  const other = createCalls(otherScope);
  await Promise.all([api.setMuted(true, call), other.setMuted(true, call)]);
  assert.equal(toggles, 1, 'concurrent setters must not toggle back');
  await api.setDeafened(true, call);
  assert.equal((await api.getCurrent()).deafened, true);
  assert.equal(call.muted, false, 'snapshots are detached');
  fail = true;
  await assert.rejects(api.setMuted(false, call), /Host failure/);
  fail = false;
  await api.setMuted(false, call);
  await assert.rejects(api.setMuted('yes', call), /boolean/);
  host.c.delete(2);
  await assert.rejects(api.leave(call), /controls are unavailable/);
  host.c.set(2, { exports: controls });
  voice = { ...voice, channelId: 'two' };
  await assert.rejects(api.leave(call), /no longer current/);
  assert.equal(leaves, 0);
  await api.leave(await api.getCurrent());
  assert.equal(leaves, 1);
  await assert.rejects(api.leave(call), /no longer current/);
  remove();
  remove();
  assert.equal(listeners.size, 0);
  await api.subscribe(() => {});
  scope.dispose();
  assert.equal(listeners.size, 0);
  await assert.rejects(api.getCurrent(), /disposed/);
  await assert.rejects(api.setMuted(true, call), /disposed/);
  const pending = other.subscribe(() => assert.fail('disposed listener called'));
  otherScope.dispose();
  await assert.rejects(pending, /disposed/);
  assert.equal(listeners.size, 0);
});
