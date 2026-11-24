import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'vite';

test('settings collections, version controls and source tabs remain accessible', async (context) => {
  const output = await build({
    root: fileURLToPath(new URL('../', import.meta.url)),
    logLevel: 'silent',
    build: {
      write: false,
      sourcemap: false,
      lib: { entry: 'test/settings-preview.tsx', name: 'SettingsPreview', formats: ['iife'] },
    },
  });
  const dom = new JSDOM('<main id="settings-preview" class="ss2"></main>', {
    url: 'https://yapin.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  context.after(() => dom.window.close());
  const browser = dom.window;
  const document = browser.document;
  const plugin = {
    id: 'example.com/tools/',
    src: 'https://example.com/tools/',
    local: false,
    on: false,
    update: true,
    js: '({})',
    manifest: { name: 'Tools', author: 'Test', description: 'Useful tools', version: '1.2.0' },
  };
  browser.localStorage.setItem('yapmod.plugins.v1', JSON.stringify({ plugins: [plugin] }));
  browser.localStorage.setItem(
    'yapmod.collections.v1',
    JSON.stringify([
      {
        schemaVersion: 1,
        url: 'https://example.com/index.json',
        name: 'Essentials',
        description: 'Everyday plugins',
        plugins: [
          {
            name: 'Reactions',
            author: 'Test',
            description: 'Quick reactions',
            url: 'https://example.com/reactions/',
          },
        ],
      },
    ]),
  );
  browser.eval((Array.isArray(output) ? output[0] : output).output[0].code);

  const collection = document.querySelector('.yp-collection-toggle');
  const contents = document.getElementById(collection.getAttribute('aria-controls'));
  assert.equal(collection.getAttribute('aria-expanded'), 'false');
  assert.equal(contents.hidden, true);
  collection.click();
  assert.equal(contents.hidden, false);
  assert.equal(document.querySelectorAll('.yp-collection .ss2-card').length, 0);
  assert.match(contents.textContent, /Reactions/);

  assert.equal(document.querySelector('.yp-plugin-version').open, false);
  const versionOptions = document.querySelector('.yp-plugin-version');
  versionOptions.open = true;
  document.querySelector('[aria-label="Pin Tools version"]').click();
  assert.equal(document.querySelector('.yp-plugin-version'), versionOptions);
  assert.equal(versionOptions.open, true);
  assert.match(document.querySelector('summary').textContent, /Pinned/);
  assert.equal(
    JSON.parse(browser.localStorage.getItem('yapmod.plugins.v1')).plugins[0].pinned,
    true,
  );
  document.querySelector('[aria-label="Pin Tools version"]').click();
  assert.doesNotMatch(document.querySelector('summary').textContent, /Pinned/);

  const search = document.querySelector('[aria-label="Search plugins"]');
  search.value = 'reactions';
  search.dispatchEvent(new browser.Event('input', { bubbles: true }));
  assert.equal(document.querySelector('[aria-label="Enable Tools"]'), null);
  assert.match(contents.textContent, /Reactions/);

  [...document.querySelectorAll('button')]
    .find((button) => button.textContent.includes('Add Plugin'))
    .click();
  await Promise.resolve();
  const tabs = document.querySelector('[role="tablist"]');
  const press = (key) =>
    tabs.dispatchEvent(new browser.KeyboardEvent('keydown', { key, bubbles: true }));
  const selected = () => tabs.querySelector('[aria-selected="true"]');
  assert.equal(selected().textContent, 'URL');
  press('ArrowRight');
  assert.equal(selected().textContent, 'Local');
  assert.equal(document.activeElement, selected());
  assert.ok(document.querySelector('#yp-plugin-code'));
  press('End');
  assert.equal(selected().textContent, 'Collection');
  assert.ok(document.querySelector('#yp-collection-url'));
  assert.equal(
    document.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby'),
    selected().id,
  );
  press('Home');
  press('ArrowLeft');
  assert.equal(selected().textContent, 'Collection');
  assert.equal(tabs.querySelectorAll('[tabindex="0"]').length, 1);
  tabs.style.direction = 'rtl';
  press('ArrowRight');
  assert.equal(selected().textContent, 'Local');
});

test('theme collection import lists both themes and keeps their switches independent', async (context) => {
  const output = await build({
    root: fileURLToPath(new URL('../', import.meta.url)),
    logLevel: 'silent',
    build: {
      write: false,
      sourcemap: false,
      lib: { entry: 'test/settings-preview.tsx', name: 'SettingsPreview', formats: ['iife'] },
    },
  });
  const dom = new JSDOM('<main id="settings-preview"></main>', {
    url: 'https://yapin.test/themes',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  context.after(() => dom.window.close());
  const browser = dom.window;
  const document = browser.document;
  const source = 'https://example.com/index.json';
  browser.fetch = async (url) => {
    assert.equal(url, source);
    return Response.json({
      schemaVersion: 1,
      name: 'Palettes',
      themes: [
        { name: 'Rose', url: './rose.css' },
        { name: 'Ocean', url: './ocean.css' },
      ],
    });
  };
  browser.eval((Array.isArray(output) ? output[0] : output).output[0].code);
  const button = (name) =>
    [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === name);
  button('Add Theme').click();
  button('Collection').click();
  const input = document.querySelector('#yp-theme-collection');
  input.value = source;
  input.dispatchEvent(new browser.Event('input', { bubbles: true }));
  button('Add Collection').click();
  await new Promise((resolve) => setImmediate(resolve));
  document.querySelector('[aria-label="Expand Palettes"]').click();
  assert.match(document.querySelector('.yp-collection-list').textContent, /Rose.*Ocean/s);
  button('Install').click();
  button('Install').click();
  document.querySelector('[aria-label="Enable Ocean"]').click();
  const saved = JSON.parse(browser.localStorage.getItem('yapmod.themes.v1'));
  assert.deepEqual(saved.online, ['https://example.com/rose.css', 'https://example.com/ocean.css']);
  assert.deepEqual(saved.enabledOnline, ['https://example.com/ocean.css']);
});
