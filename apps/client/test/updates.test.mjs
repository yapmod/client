import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInThisContext } from 'node:vm';
import { createServer } from 'vite';

async function waitForCandidate() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

test('normal updates commit after startup and preserve one restorable version', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());
  t.mock.method(console, 'error', () => {});
  const disk = new Map();
  const fixture = { active: '', gate: undefined, starts: 0 };
  let failSave = false;
  let remote;
  let fetchGate;
  let requests = 0;
  const globals = {
    fixture,
    localStorage: {
      getItem: (key) => disk.get(key),
      setItem(key, value) {
        if (failSave) throw Error('storage full');
        disk.set(key, value);
      },
    },
    document: {
      createElement: () => ({ remove() {} }),
      head: { append: (script) => runInThisContext(script.textContent) },
    },
    fetch: async (url) => {
      requests++;
      const data = remote;
      if (fetchGate) await fetchGate;
      return {
        ok: true,
        text: async () => (url.endsWith('.json') ? JSON.stringify(data.manifest) : data.js),
      };
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  const history = { local: true, js: '({})', manifest: { name: 'Old', author: 'Test' } };
  disk.set(
    'yapmod.plugins.v1',
    JSON.stringify({
      plugins: [
        {
          id: 'valid',
          local: true,
          js: '({})',
          previous: { ...history, previous: history },
          pinned: true,
        },
        {
          id: 'invalid',
          local: true,
          js: '({})',
          previous: { ...history, js: 42 },
          pinned: 'true',
        },
        {
          id: 'bad-url',
          local: true,
          js: '({})',
          previous: { ...history, local: false, src: 'javascript:bad' },
        },
      ],
    }),
  );
  const runtime = await server.ssrLoadModule('/src/features/plugins/runtime.ts');
  const store = await server.ssrLoadModule('/src/features/plugins/store.ts');
  const {
    updatePlugin,
    restorePlugin,
    setPluginPinned,
    setPluginEnabled,
    removePlugin,
    editPlugin,
  } = runtime;
  assert.equal(store.getPluginRecord('valid').previous.js, '({})');
  assert.equal(store.getPluginRecord('valid').previous.previous, undefined);
  assert.equal(store.getPluginRecord('valid').pinned, true);
  assert.equal(store.getPluginRecord('invalid').previous, undefined);
  assert.equal(store.getPluginRecord('invalid').pinned, false);
  assert.equal(store.getPluginRecord('bad-url').previous, undefined);
  for (const id of ['valid', 'invalid', 'bad-url']) store.removePluginRecord(id);

  const working = `({ onLoad() { fixture.starts++; fixture.active = yapmod.manifest.version; }, onUnload() { fixture.active = ''; } })`;
  const original = {
    id: 'test',
    local: false,
    src: 'https://example.com/plugin/',
    on: true,
    update: true,
    js: working,
    manifest: { name: 'Example', author: 'Test', description: 'Fixture', version: '1' },
  };
  const saved = () => store.getPluginRecord('test');
  const diskPlugin = () => JSON.parse(disk.get('yapmod.plugins.v1')).plugins[0];
  const offer = (version, js = working) => {
    remote = { manifest: { ...original.manifest, version }, js };
  };
  const reset = () => {
    runtime.stopPlugin('test');
    if (saved()) store.replacePluginRecord('test', { ...original });
    else store.addPluginRecord({ ...original });
    assert.equal(runtime.startPlugin('test'), true);
  };
  reset();
  offer('1');
  assert.equal(await updatePlugin('test'), 'current');
  for (const js of [
    'null',
    '({onLoad(){throw Error("bad")}})',
    '({async onLoad(){throw Error("bad")}})',
    '({onLoad(){return {then(resolve,reject){reject(Error("thenable"))}}}})',
  ]) {
    offer('2', js);
    assert.equal(await updatePlugin('test'), 'rolled-back');
    assert.equal(saved().js, working);
    assert.equal(diskPlugin().manifest.version, '1');
    assert.equal(fixture.active, '1');
  }
  let finish;
  fixture.gate = new Promise((resolve) => {
    finish = resolve;
  });
  offer('2', '({ onLoad(){return fixture.gate} })');
  const pending = updatePlugin('test');
  await waitForCandidate();
  assert.equal(diskPlugin().manifest.version, '1');
  assert.equal(await updatePlugin('test'), 'failed');
  finish();
  assert.equal(await pending, 'updated');
  assert.equal(saved().previous.manifest.version, '1');
  assert.equal(saved().previous.previous, undefined);
  assert.equal(await restorePlugin('test'), 'updated');
  assert.equal(fixture.active, '1');
  assert.equal(saved().pinned, true);
  const count = requests;
  offer('3');
  assert.equal(await updatePlugin('test', true), 'current');
  assert.equal(requests, count);
  assert.equal(await updatePlugin('test'), 'updated');
  assert.equal(saved().previous.manifest.version, '1');
  assert.equal(saved().previous.previous, undefined);
  setPluginPinned('test', false);
  offer('4');
  failSave = true;
  assert.equal(await updatePlugin('test'), 'rolled-back');
  failSave = false;
  assert.equal(saved().manifest.version, '3');
  assert.equal(fixture.active, '3');

  offer('4');
  const goodFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async () => {
      throw Error('offline');
    },
  });
  assert.equal(await updatePlugin('test'), 'failed');
  assert.equal(saved().manifest.version, '3');
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: goodFetch });

  setPluginEnabled('test', false);
  offer('5', 'throw Error("disabled source executed")');
  const disabledRequests = requests;
  assert.equal(await updatePlugin('test', true), 'current');
  assert.equal(requests, disabledRequests);
  assert.equal(await updatePlugin('test'), 'updated');
  assert.equal(saved().on, false);
  assert.equal(fixture.active, '');
  assert.equal(await restorePlugin('test'), 'updated');
  assert.equal(saved().on, false);

  // Fetches cannot overwrite a newer edit, toggle, pin or removal.
  for (const change of [
    () => setPluginEnabled('test', false),
    () => setPluginPinned('test', true),
    () => removePlugin('test'),
    () =>
      editPlugin('test', {
        local: true,
        name: 'Edited',
        author: 'Test',
        description: '',
        code: working,
        src: '',
        update: false,
      }),
  ]) {
    reset();
    offer('6');
    fetchGate = new Promise((resolve) => {
      finish = resolve;
    });
    const updating = updatePlugin('test');
    await change();
    const chosen = saved();
    fetchGate = undefined;
    finish();
    assert.equal(await updating, 'failed');
    assert.equal(saved(), chosen);
  }
  // Pending startup cannot re-enable or resurrect a stopped/removed plugin.
  for (const change of [
    () => setPluginEnabled('test', false),
    () => setPluginEnabled('test', true),
    () => setPluginPinned('test', true),
    () => removePlugin('test'),
    () =>
      editPlugin('test', {
        local: true,
        name: 'Edited',
        author: 'Test',
        description: '',
        code: working,
        src: '',
        update: false,
      }),
  ]) {
    reset();
    fixture.gate = new Promise((resolve) => {
      finish = resolve;
    });
    offer('7', '({onLoad(){return fixture.gate}})');
    const updating = updatePlugin('test');
    await waitForCandidate();
    await change();
    const chosen = saved();
    finish();
    assert.equal(await updating, 'failed');
    assert.equal(saved(), chosen);
  }

  // Failure to restart the old lifecycle is reported as failed and disabled.
  reset();
  store.replacePluginRecord('test', {
    ...saved(),
    js: '({async onLoad(){throw Error("old version failed")}})',
  });
  offer('8', '({onLoad(){throw Error("candidate failed")}})');
  assert.equal(await updatePlugin('test'), 'failed');
  assert.equal(saved().on, false);
  assert.deepEqual([...runtime.runningPluginIds()], []);

  // Startup auto-updates run the candidate before committing it.
  reset();
  runtime.stopPlugin('test');
  offer('8', '({async onLoad(){throw Error("startup failure")}})');
  let dispose;
  runtime.installPlugins({
    onDispose(fn) {
      dispose = fn;
    },
  });
  await waitForCandidate();
  assert.equal(saved().manifest.version, '1');
  assert.equal(fixture.active, '1');

  fixture.gate = new Promise((resolve) => {
    finish = resolve;
  });
  offer('9', '({onLoad(){return fixture.gate}})');
  const shutdown = updatePlugin('test');
  await waitForCandidate();
  dispose();
  finish();
  assert.equal(await shutdown, 'failed');
  assert.equal(saved().manifest.version, '1');
  assert.deepEqual([...runtime.runningPluginIds()], []);
});
