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

const bundlePath = fileURLToPath(new URL('./hello/dist/plugin.js', import.meta.url));
const bundle = await readFile(bundlePath, 'utf8');

// The bundle must resolve Solid only through the shared API — no imports,
// no bundled copy.
assert.ok(!/from\s+["']solid-js/.test(bundle), 'bundle must not import solid-js');
assert.ok(bundle.includes('yapmod.solid'), 'bundle must read solid-js from the API');
assert.ok(bundle.includes('yapmod.solidWeb'), 'JSX helpers must come from the API too');

// Mirrors the wrapper in apps/client/src/features/plugins/eval.ts: the source
// is an expression, and a function result is called with the plugin API.
// `new Function` is fine here — this is a trusted Node test, not the page.
const evaluate = new Function(
  'yapmod',
  `let value = (function () { return ${bundle} })();
if (typeof value === 'function') value = value(yapmod);
return value;`,
);

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

const pluginModule = evaluate(api);
assert.equal(typeof pluginModule, 'object');
assert.equal(typeof pluginModule.onLoad, 'function');

pluginModule.onLoad();

assert.deepEqual(observed, ['body']);
assert.equal(registered.length, 1);
assert.equal(registered[0].id, 'hello');
assert.equal(registered[0].icon, 'pencil');
assert.equal(typeof registered[0].render, 'function');
assert.doesNotThrow(() => registered[0].render(), 'compiled JSX must execute');
assert.equal(api.storage.visits, 1);
assert.match(logs.join('\n'), /visit #1/);

console.log('check passed: bundle loads through the expression wrapper');
