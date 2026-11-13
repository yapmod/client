import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import * as solid from 'solid-js';
import * as solidStore from 'solid-js/store';

/*
 * solid-js/web's server build throws for the DOM helpers Babel hoists to
 * module scope (`template` creates elements). The test never renders into a
 * real document — it only loads the bundle and runs the lifecycle — so a
 * callable stand-in is the Node equivalent of the browser's web build.
 */
const solidWeb = new Proxy(
  {},
  {
    get(_target, key) {
      if (key === '__esModule') return false;
      return () => () => ({});
    },
  },
);

/*
 * Mirrors the wrapper in apps/client/src/features/plugins/eval.ts: the
 * source is an expression, and a function result is called with the plugin
 * API. `new Function` is fine here — this is a trusted Node test, not the
 * page.
 */
function evaluate(source, api) {
  return new Function(
    'yapmod',
    `let value = (function () { return ${source} })();
if (typeof value === 'function') value = value(yapmod);
return value;`,
  )(api);
}

function createApi() {
  const logs = [];
  const observed = [];
  const registered = [];

  const api = {
    apiVersion: 1,
    id: 'hello',
    manifest: { name: 'Hello', author: 'yapmod', description: 'sample plugin' },
    storage: {},
    flushStorage() {},
    log(...args) {
      logs.push(args.join(' '));
    },
    observe(selector) {
      observed.push(selector);
      return () => {};
    },
    ui: {
      showToast() {},
      openModal() {
        return () => {};
      },
      injectCss() {
        return () => {};
      },
      Button() {},
      Hint() {},
      Panel() {},
      Icon() {},
    },
    settings: {
      registerSection(section) {
        registered.push(section);
        return () => {};
      },
    },
    onDispose() {},
    showSettings() {},
    solid,
    solidWeb,
    solidStore,
  };

  return { api, logs, observed, registered };
}

async function verifyBundle(relativePath) {
  const path = fileURLToPath(new URL(`./hello/dist/${relativePath}`, import.meta.url));
  const bundle = await readFile(path, 'utf8');

  // The bundle must resolve Solid only through the shared API — no imports,
  // no bundled copy.
  assert.ok(!/from\s+["']solid-js/.test(bundle), `${relativePath}: must not import solid-js`);
  assert.ok(bundle.includes('yapmod.solid'), `${relativePath}: must read solid-js from the API`);
  assert.ok(bundle.includes('yapmod.solidWeb'), `${relativePath}: JSX helpers from the API`);

  const { api, logs, observed, registered } = createApi();
  const pluginModule = evaluate(bundle, api);
  assert.equal(typeof pluginModule, 'object', `${relativePath}: module must be an object`);
  assert.equal(typeof pluginModule.onLoad, 'function', `${relativePath}: onLoad hook`);

  pluginModule.onLoad();

  assert.deepEqual(observed, ['body'], `${relativePath}: observe() wiring`);
  assert.equal(registered.length, 1, `${relativePath}: one settings section`);
  assert.equal(registered[0].id, 'hello', `${relativePath}: section id`);
  assert.equal(registered[0].icon, 'pencil', `${relativePath}: section icon`);
  assert.equal(typeof registered[0].render, 'function', `${relativePath}: section render`);
  assert.doesNotThrow(() => registered[0].render(), `${relativePath}: compiled JSX must execute`);
  assert.equal(api.storage.visits, 1, `${relativePath}: storage write`);
  assert.match(logs.join('\n'), /visit #1/, `${relativePath}: log output`);

  console.log(`check passed: ${relativePath} loads through the expression wrapper`);
}

// Both build paths must produce a loadable expression: the builder's own
// esbuild bundle and the documented vite recipe.
await verifyBundle('plugin.js');
await verifyBundle('vite-plugin.js');
