import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInThisContext } from 'node:vm';
import { createServer } from 'vite';

test('dev builds become current only after startup succeeds', async (t) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const server = await createServer({
    root,
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());

  t.mock.method(console, 'error', () => {});
  const disk = new Map();
  const fixture = { starts: 0, active: '', gate: undefined };
  const globals = {
    localStorage: {
      getItem: (key) => disk.get(key),
      setItem: (key, value) => disk.set(key, value),
    },
    document: {
      createElement: () => ({ remove() {} }),
      head: { append: (script) => runInThisContext(script.textContent) },
    },
    fixture,
  };
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  const { applyDevUpdate, stopDevPlugins } = await server.ssrLoadModule(
    '/src/features/dev/apply.ts',
  );
  const { setPluginEnabled } = await server.ssrLoadModule('/src/features/plugins/runtime.ts');

  const payload = { id: 'dev:test', name: 'Example', author: 'Test', description: 'Fixture' };
  const send = (code, version = '1') => applyDevUpdate({ ...payload, code, version });
  const saved = () => JSON.parse(disk.get('yapmod.plugins.v1') ?? '{"plugins":[]}').plugins[0];
  const working = `({
    onLoad() { fixture.starts++; fixture.active = yapmod.manifest.version; },
    onUnload() { fixture.active = ''; }
  })`;
  const broken = '({ onLoad() { fixture.starts++; throw Error("broken build"); } })';

  // The same rejected first build must attempt startup each time.
  assert.equal((await send(broken)).ok, false);
  assert.equal((await send(broken)).ok, false);
  assert.equal(fixture.starts, 2);
  assert.equal(saved(), undefined);

  assert.equal((await send(working)).ok, true);
  const original = saved();
  assert.equal(fixture.active, '1');
  const starts = fixture.starts;
  assert.equal((await send(working)).ok, true);
  assert.equal(fixture.starts, starts);

  // Evaluation failure leaves the original instance running. A failing hook
  // must restore it, including when startup rejects asynchronously.
  for (const code of ['null', broken, '({ async onLoad() { throw Error("async failure"); } })']) {
    assert.equal((await send(code, '2')).ok, false);
    assert.deepEqual(saved(), original);
    assert.equal(fixture.active, '1');
  }

  assert.equal((await send(working, '2')).ok, true);
  assert.equal(fixture.active, '2');
  assert.equal(saved().manifest.version, '2');

  // An older pending startup must never overwrite a newer accepted build.
  let finish;
  fixture.gate = new Promise((resolve) => {
    finish = resolve;
  });
  const waiting = send('({ onLoad() { return fixture.gate; } })', '3');
  assert.equal(saved().manifest.version, '2');
  assert.equal((await send(working, '4')).ok, true);
  finish();
  assert.equal((await waiting).ok, false);
  assert.equal(saved().manifest.version, '4');
  assert.equal(fixture.active, '4');

  stopDevPlugins();
  assert.equal(fixture.active, '');
  assert.equal((await send(working, '4')).ok, true);
  assert.equal(fixture.active, '4');

  // Turning off the bridge must stop a first build still awaiting startup,
  // even though that plugin has no installed record for the UI to enumerate.
  fixture.gate = new Promise((resolve) => {
    finish = resolve;
  });
  const first = applyDevUpdate({
    ...payload,
    id: 'dev:first',
    code: '({ onLoad() { return fixture.gate; } })',
  });
  stopDevPlugins();
  finish();
  assert.equal((await first).ok, false);
  assert.equal(JSON.parse(disk.get('yapmod.plugins.v1')).plugins.length, 1);

  setPluginEnabled(payload.id, false);
  assert.equal((await send(broken, '5')).ok, true);
  assert.equal(saved().on, false);
  assert.equal(saved().js, broken);
  assert.equal(fixture.active, '');
});
