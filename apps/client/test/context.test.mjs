import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('app context and native navigation are detached, validated and lifecycle-owned', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());
  t.after(() => Reflect.deleteProperty(globalThis, 'TURBOPACK'));
  const { createAppContext } = await server.ssrLoadModule('/src/features/plugins/context.ts');
  const { PluginScope } = await server.ssrLoadModule('/src/features/plugins/scope.ts');
  const scope = new PluginScope(false);
  t.after(() => scope.dispose());
  const { context, navigation } = createAppContext(scope);
  globalThis.TURBOPACK = [];
  await assert.rejects(context.getCurrent(), /not ready/);
  await assert.rejects(
    context.subscribe(() => {}),
    /not ready/,
  );
  const host = { c: new Map() };
  let boot;
  globalThis.TURBOPACK = {
    push(chunk) {
      if (typeof chunk[2] === 'function') boot = chunk[2];
      else boot(host);
    },
  };
  await assert.rejects(context.getCurrent(), /store is unavailable/);
  const state = {
    booted: true,
    activeChannelId: null,
    activeServerId: null,
    userId: 'me',
    channels: { one: { id: 'one' }, dm: { id: 'dm' } },
    servers: { server: { id: 'server' } },
    profiles: { me: { id: 'me', privateField: 'never exposed' } },
  };
  const listeners = new Set();
  const emit = () => [...listeners].forEach((listener) => listener());
  let failRead = false;
  const store = {
    getState() {
      if (failRead) throw new Error('unavailable');
      return state;
    },
    useStore: Object.assign(() => {}, {
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    }),
  };
  host.c.set('unrelated', {
    exports: {
      getState() {
        throw new Error('ignore');
      },
      useStore: store.useStore,
    },
  });
  host.c.set('store', { exports: store });
  assert.deepEqual(await context.getCurrent(), {
    available: true,
    channel: null,
    server: null,
    user: { id: 'me' },
  });
  const seen = [];
  const remove = await context.subscribe((snapshot) => seen.push(snapshot));
  emit();
  assert.equal(seen.length, 1);
  state.activeChannelId = 'one';
  state.activeServerId = 'server';
  emit();
  const snapshot = seen[1];
  assert.ok(Object.isFrozen(snapshot));
  for (const key of ['channel', 'server', 'user']) assert.ok(Object.isFrozen(snapshot[key]));
  assert.deepEqual(Object.keys(snapshot.user), ['id']);
  state.userId = 'other';
  emit();
  assert.equal(snapshot.user.id, 'me');
  state.booted = false;
  emit();
  assert.deepEqual(seen.at(-1), { available: false });
  await assert.rejects(navigation.openChannel('one'), /context is unavailable/);
  state.booted = true;
  state.activeChannelId = undefined;
  assert.deepEqual(await context.getCurrent(), { available: false });
  state.activeChannelId = null;
  state.userId = null;
  emit();
  assert.equal(seen.at(-1).user, null);
  failRead = true;
  emit();
  assert.deepEqual(seen.at(-1), { available: false });
  failRead = false;
  emit();
  await assert.rejects(navigation.openChannel('one'), /actions are unavailable/);
  const calls = [];
  host.c.set('channels', {
    exports: {
      preloadChannel() {},
      openChannel(id) {
        calls.push(['channel', id]);
        state.activeChannelId = id;
        state.activeServerId = id === 'one' ? 'server' : null;
        emit();
      },
    },
  });
  host.c.set('servers', {
    exports: {
      serverOpenChannel() {},
      openServer(id) {
        calls.push(['server', id]);
        state.activeServerId = id;
        state.activeChannelId = id ? 'one' : null;
        emit();
      },
    },
  });
  await navigation.openChannel('dm');
  assert.equal(seen.at(-1).channel.id, 'dm');
  assert.equal(seen.at(-1).server, null);
  await navigation.openServer('server');
  await navigation.openDirectMessages();
  assert.deepEqual(calls, [
    ['channel', 'dm'],
    ['server', 'server'],
    ['server', null],
  ]);
  for (const id of ['', null, {}, 1])
    await assert.rejects(navigation.openChannel(id), /non-empty ID/);
  await assert.rejects(navigation.openServer('missing'), /not loaded/);
  await assert.rejects(navigation.openChannel('__proto__'), /not loaded/);
  state.channels.bad = { id: 'different' };
  await assert.rejects(navigation.openChannel('bad'), /Unsupported/);
  host.c.get('channels').exports.openChannel = () => {
    throw new Error('Host failure');
  };
  await assert.rejects(navigation.openChannel('one'), /Host failure/);
  remove();
  remove();
  assert.equal(listeners.size, 0);
  const originalError = console.error;
  console.error = () => {};
  try {
    await context.subscribe(() => {
      throw new Error('Listener failure');
    });
    await context.subscribe(() => {});
    state.activeChannelId = 'one';
    emit();
  } finally {
    console.error = originalError;
  }
  assert.equal(listeners.size, 2);
  scope.dispose();
  assert.equal(listeners.size, 0);
  await assert.rejects(context.getCurrent(), /disposed/);
  await assert.rejects(
    context.subscribe(() => {}),
    /disposed/,
  );
  await assert.rejects(navigation.openServer('server'), /disposed/);
  await assert.rejects(navigation.openDirectMessages(), /disposed/);
  const pendingScope = new PluginScope(false);
  const pending = createAppContext(pendingScope);
  const subscribing = pending.context.subscribe(() => assert.fail('disposed listener'));
  const navigating = pending.navigation.openServer('server');
  const reading = pending.context.getCurrent();
  pendingScope.dispose();
  await assert.rejects(subscribing, /disposed/);
  await assert.rejects(navigating, /disposed/);
  await assert.rejects(reading, /disposed/);
  assert.equal(listeners.size, 0);
  assert.equal(calls.length, 3);
});
