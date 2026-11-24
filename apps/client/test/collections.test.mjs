import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('collection indexes validate, persist atomically, and keep installations independent', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());
  const source = 'https://example.com/plugins/index.json';
  const index = {
    schemaVersion: 1,
    name: 'Examples',
    plugins: [{ name: 'Example', url: './example/plugin.json' }],
  };
  const key = 'yapmod.collections.v1';
  const disk = new Map([
    [
      key,
      JSON.stringify([
        { ...index, url: source },
        { ...index, url: source },
        { ...index, url: 'javascript:alert(1)' },
        { ...index, url: 'https://invalid.test/', plugins: [null] },
      ]),
    ],
  ]);
  let failStorage = false;
  let requests = [];
  let reply = () => Response.json(index);
  const globals = {
    localStorage: {
      getItem: (name) => disk.get(name),
      setItem: (name, value) => {
        if (failStorage) throw new Error('Storage full');
        disk.set(name, value);
      },
    },
    fetch: async (url) => {
      requests.push(url);
      return reply(url);
    },
  };
  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  t.mock.method(console, 'error', () => {});
  const { parseCollection, collectionUrl } = await server.ssrLoadModule(
    '/src/features/collections/manifest.ts',
  );
  const { collections, addCollection, refreshCollection, removeCollection } =
    await server.ssrLoadModule('/src/features/collections/store.ts');

  assert.equal(collections().length, 1, 'malformed records and duplicates are dropped on load');
  assert.equal(collections()[0].plugins[0].url, 'https://example.com/plugins/example/');
  assert.deepEqual(requests, [], 'loading stored collections does not fetch');
  assert.equal(collectionUrl(` ${source}#fragment `), source);
  assert.throws(() => collectionUrl('https://user:password@example.com/index.json'), /credentials/);
  for (const invalid of [
    null,
    [],
    {},
    { ...index, schemaVersion: 2 },
    { ...index, name: '' },
    { ...index, plugins: [{}] },
    { ...index, plugins: [{ name: 'Unsafe', url: 'javascript:alert(1)' }] },
    { ...index, plugins: [...index.plugins, { name: 'Duplicate', url: './example/plugin.js' }] },
  ])
    assert.throws(() => parseCollection(invalid, source));
  assert.deepEqual(parseCollection({ ...index, plugins: [] }, source).plugins, []);
  await assert.rejects(addCollection(`${source}#duplicate`), /already added/);
  assert.deepEqual(requests, []);

  const original = collections()[0];
  for (const badReply of [
    () => new Response('missing', { status: 404 }),
    () => new Response('<html>not JSON</html>'),
    () => Response.json({ ...index, plugins: [{}] }),
    () => {
      throw new TypeError('Network blocked');
    },
  ]) {
    reply = badReply;
    await assert.rejects(refreshCollection(source));
    assert.equal(collections()[0], original, 'failed refresh preserves cached listing');
  }

  reply = () => Response.json({ ...index, name: 'Updated' });
  failStorage = true;
  await assert.rejects(refreshCollection(source), /browser storage/);
  assert.throws(() => removeCollection(source), /browser storage/);
  assert.equal(collections()[0], original);
  failStorage = false;
  await refreshCollection(source);
  assert.equal(collections()[0].name, 'Updated');
  assert.equal(JSON.parse(disk.get(key))[0].name, 'Updated');

  // Relative paths follow the final response URL while subscriptions keep their original URL.
  reply = () => {
    const response = Response.json(index);
    Object.defineProperty(response, 'url', { value: 'https://cdn.example.com/release/index.json' });
    return response;
  };
  await refreshCollection(source);
  assert.equal(collections()[0].url, source);
  assert.equal(collections()[0].plugins[0].url, 'https://cdn.example.com/release/example/');

  let finish;
  reply = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const pending = refreshCollection(source);
  removeCollection(source);
  finish(Response.json(index));
  await pending;
  assert.equal(collections().length, 0, 'pending refresh cannot resurrect a removed collection');

  reply = () => Response.json(index);
  requests = [];
  const adds = await Promise.allSettled([addCollection(source), addCollection(source)]);
  assert.equal(adds.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(collections().length, 1);
  assert.deepEqual(requests, [source, source], 'adding only fetches index metadata');

  const { themeCatalogs } = await server.ssrLoadModule('/src/features/collections/store.ts');
  const { addOnlineTheme, themeState } = await server.ssrLoadModule(
    '/src/features/themes/store.ts',
  );
  await assert.rejects(themeCatalogs.addCollection(source), /themes array/);
  const themes = [
    { name: 'Rose', url: './rose.theme.css' },
    { name: 'Ocean', url: './ocean.theme.css' },
  ];
  reply = () => Response.json({ schemaVersion: 1, name: 'Palettes', themes });
  requests = [];
  await themeCatalogs.addCollection(source);
  assert.deepEqual(requests, [source]);
  assert.deepEqual(themeState().online, []);
  const catalog = themeCatalogs.collections()[0];
  assert.deepEqual(
    catalog.themes.map((entry) => entry.url),
    ['https://example.com/plugins/rose.theme.css', 'https://example.com/plugins/ocean.theme.css'],
  );
  for (const entry of catalog.themes) addOnlineTheme(entry.url, false);
  assert.deepEqual(themeState().enabledOnline, []);
  reply = () =>
    Response.json({ schemaVersion: 1, name: 'Invalid', themes: [...themes, themes[0]] });
  await assert.rejects(themeCatalogs.refreshCollection(source), /duplicates/);
  assert.equal(themeCatalogs.collections()[0], catalog);
  themeCatalogs.removeCollection(source);
  assert.equal(themeState().online.length, 2);
  assert.equal(
    collections().length,
    1,
    'theme subscriptions are independent from plugin subscriptions',
  );

  const { addRemotePlugin } = await server.ssrLoadModule('/src/features/plugins/runtime.ts');
  const { pluginState } = await server.ssrLoadModule('/src/features/plugins/store.ts');
  reply = (url) =>
    url.endsWith('plugin.json')
      ? Response.json({ name: 'Actual manifest name', author: 'Author', description: 'Example' })
      : new Response('({ onLoad() { throw Error("must not execute during installation"); } })');
  const plugin = await addRemotePlugin(collections()[0].plugins[0].url, false);
  assert.equal(plugin.on, false);
  assert.equal(plugin.update, false);
  assert.equal(plugin.manifest.name, 'Actual manifest name');
  const { findCollectionPlugin, collectionMatches, collectionPluginIdConflict } =
    await server.ssrLoadModule('/src/features/collections/membership.ts');
  const entry = collections()[0].plugins[0];
  assert.equal(findCollectionPlugin(entry, pluginState().plugins), plugin);
  assert.equal(
    collectionMatches(collections()[0], 'Actual manifest name', pluginState().plugins),
    true,
    'search includes the installed manifest as well as index metadata',
  );
  assert.equal(collectionMatches(collections()[0], 'Examples', []), true);
  assert.equal(collectionMatches(collections()[0], 'missing', pluginState().plugins), false);
  const sharedCollection = { ...collections()[0], name: 'Another collection' };
  assert.equal(
    findCollectionPlugin(sharedCollection.plugins[0], pluginState().plugins),
    plugin,
    'shared collection entries control the same installation',
  );
  const edited = { ...plugin, src: 'https://example.com/changed/' };
  assert.equal(
    findCollectionPlugin(entry, [edited]),
    undefined,
    'changing the source moves a plugin out of its old collection',
  );
  assert.equal(
    findCollectionPlugin(entry, [{ ...plugin, local: true }]),
    undefined,
    'converting a plugin to local moves it outside collections',
  );
  assert.equal(
    collectionPluginIdConflict(entry, [edited]),
    true,
    'a retained id must not offer an installation that will fail',
  );
  await assert.rejects(
    addRemotePlugin(collections()[0].plugins[0].url, false),
    /already installed/,
  );
  removeCollection(source);
  assert.equal(pluginState().plugins.length, 1, 'removing a collection keeps installed plugins');
});
