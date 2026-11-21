import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'vite';

const fixture = `<aside class="sidebar" aria-label="Channels"><div class="sidebar-scroll"><div class="channel-row" data-nav-chan="channel-1"><button class="channel-main">General</button></div></div></aside><main><header class="main-head"></header><div class="chat-wrap"><div class="chat"><div class="messages" data-chat="channel-1"></div></div></div></main><aside class="members-panel"><div data-vkey="member:user-1"><button>Person</button></div></aside>`;
const tick = () => new Promise((resolve) => setTimeout(resolve, 30));
const action = (onSelect = () => {}) => ({ id: 'same', label: 'Test action', onSelect });
test('typed locations own their DOM, context and Solid lifecycle', async (t) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = await build({
    root,
    logLevel: 'silent',
    build: {
      write: false,
      sourcemap: false,
      lib: { entry: 'test/locations-entry.ts', name: 'LocationTest', formats: ['iife'] },
    },
  });
  const dom = new JSDOM(fixture, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://yapin.test/',
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.eval((Array.isArray(output) ? output[0] : output).output[0].code);
  const { registerLocation, openDockedPanel, registerLocationMenu, onCleanup } = w.locationTest;
  const d = w.document;
  let selected;
  const stopA = registerLocation(
    'a',
    'header',
    action((c) => {
      selected = c.chatId;
    }),
  );
  const stopB = registerLocation('b', 'header', action());
  const stopSide = registerLocation('a', 'sidebar', action());
  assert.throws(() => registerLocation('a', 'header', action()), /Duplicate/);
  assert.equal(d.querySelectorAll('.yp-location-header').length, 2);
  d.querySelector('.yp-location-header button').click();
  assert.equal(selected, 'channel-1');
  const stale = d.querySelector('.yp-location-header button');
  const header = d.querySelector('.main-head');
  header.replaceWith(header.cloneNode(false));
  selected = undefined;
  stale.click();
  assert.equal(selected, undefined);
  await tick();
  assert.equal(d.querySelectorAll('.yp-location-header').length, 2);
  d.querySelector('.messages').dataset.chat = 'channel-2';
  d.querySelector('.yp-location-header button').click();
  assert.equal(selected, undefined);
  await tick();
  d.querySelector('.yp-location-header button').click();
  assert.equal(selected, 'channel-2');
  const messages = d.querySelector('.messages');
  messages.replaceWith(messages.cloneNode(true));
  await tick();
  selected = undefined;
  d.querySelector('.yp-location-header button').click();
  assert.equal(selected, 'channel-2');
  stopA();
  stopA();
  assert.equal(d.querySelectorAll('.yp-location-header').length, 1);
  stopB();
  stopSide();
  assert.equal(d.querySelectorAll('.yp-location').length, 0);
  d.querySelector('.main-head').remove();
  const missing = registerLocation('missing', 'header', action());
  assert.equal(d.querySelectorAll('.yp-location').length, 0);
  d.querySelector('main').insertAdjacentHTML('afterbegin', '<header class="main-head"></header>');
  await tick();
  assert.equal(d.querySelectorAll('.yp-location').length, 1);
  missing();

  let cleans = 0;
  const panel = {
    id: 'panel',
    title: 'Panel',
    render: (c) => {
      onCleanup(() => {
        cleans++;
      });
      return c.chatId;
    },
  };
  const close = openDockedPanel('a', panel);
  assert.equal(d.querySelectorAll('.yp-docked-panel').length, 1);
  assert.throws(() => openDockedPanel('a', panel), /already open/);
  const closeOther = openDockedPanel('b', panel);
  close();
  close();
  assert.equal(cleans, 1);
  closeOther();
  assert.equal(cleans, 2);
  openDockedPanel('a', panel);
  d.querySelector('.yp-docked-panel button').click();
  assert.equal(cleans, 3);
  openDockedPanel('a', panel);
  d.querySelector('.messages').dataset.chat = 'channel-3';
  await tick();
  assert.equal(cleans, 4);
  assert.equal(d.querySelectorAll('.yp-docked-panel').length, 0);
  openDockedPanel('a', panel);
  d.querySelector('.yp-docked-panel').dispatchEvent(
    new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  assert.equal(cleans, 5);

  for (const target of ['channel', 'user']) {
    const row = d.querySelector(target === 'channel' ? '.channel-row' : '[data-vkey]');
    let visible = true;
    let context;
    const stop = registerLocationMenu('a', target, {
      ...action((c) => {
        context = c;
      }),
      visible: () => visible,
    });
    const other = registerLocationMenu('b', target, action());
    assert.throws(() => registerLocationMenu('a', target, action()), /Duplicate/);
    function menu() {
      row.dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true }));
      const owner =
        target === 'user'
          ? d.querySelector('.members-panel')
          : d.body.appendChild(d.createElement('div'));
      if (target === 'channel') owner.className = 'overlay clear';
      const el = d.createElement('div');
      el.className = 'ctx-menu';
      el.setAttribute('role', 'menu');
      owner.append(el);
      return el;
    }
    let el = menu();
    await tick();
    assert.equal(el.querySelectorAll('[data-yp-location-menu]').length, 2);
    visible = false;
    el.querySelector('button').click();
    assert.equal(context, undefined);
    el.append(d.createElement('span'));
    await tick();
    assert.equal(el.querySelectorAll('button').length, 1);
    visible = true;
    el.append(d.createElement('span'));
    await tick();
    assert.equal(el.querySelectorAll('button').length, 2);
    [...el.querySelectorAll('button')]
      .find((b) => JSON.parse(b.dataset.ypLocationMenu)[0] === 'a')
      .click();
    assert.equal(
      context[target === 'user' ? 'userId' : 'channelId'],
      target === 'user' ? 'user-1' : 'channel-1',
    );
    el.remove();
    context = undefined;
    el = menu();
    await tick();
    const staleButton = el.querySelector('button');
    row.remove();
    staleButton.click();
    assert.equal(context, undefined);
    await tick();
    assert.equal(el.querySelectorAll('button').length, 0);
    stop();
    other();
    el.remove();
  }
  assert.equal(
    d.querySelectorAll('[data-yp-location-menu],.yp-location,.yp-docked-panel').length,
    0,
  );
  d.body.innerHTML = fixture;
  const { installPlugins, registerClientPlugin, setPluginEnabled } = w.locationTest;
  let disposeClient;
  installPlugins({
    onDispose(fn) {
      disposeClient = fn;
    },
  });
  function setup(api) {
    api.ui.registerHeaderAction(action());
    api.ui.registerSidebarEntry(action());
    api.contextMenus.registerAction('channel', action());
    api.contextMenus.registerAction('user', action());
    api.ui.openPanel(panel);
    return {};
  }
  for (const id of ['client:first', 'client:second']) {
    assert.equal(
      registerClientPlugin({
        id,
        manifest: { name: id, author: 'Test' },
        defaultEnabled: true,
        setup,
      }),
      true,
    );
  }
  assert.equal(d.querySelectorAll('.yp-location').length, 4);
  assert.equal(d.querySelectorAll('.yp-docked-panel').length, 2);
  setPluginEnabled('client:first', false);
  assert.equal(d.querySelectorAll('.yp-location').length, 2);
  assert.equal(d.querySelectorAll('.yp-docked-panel').length, 1);
  disposeClient();
  assert.equal(d.querySelectorAll('.yp-location,.yp-docked-panel').length, 0);
  d.querySelector('.channel-row').dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true }));
  d.body.insertAdjacentHTML(
    'beforeend',
    '<div class="overlay clear"><div class="ctx-menu" role="menu"></div></div>',
  );
  await tick();
  assert.equal(d.querySelectorAll('[data-yp-location-menu]').length, 0);
});
