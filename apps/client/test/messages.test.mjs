import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('loaded messages: observed schema, discovery, detached snapshots and scope lifetime', async (t) => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  t.after(() => server.close());
  t.after(() => Reflect.deleteProperty(globalThis, 'TURBOPACK'));
  const { createMessages } = await server.ssrLoadModule('/src/features/plugins/messages.ts');
  const { PluginScope } = await server.ssrLoadModule('/src/features/plugins/scope.ts');
  const scope = new PluginScope(false);
  t.after(() => scope.dispose());
  const api = createMessages(scope);
  assert.deepEqual(await api.getLoaded('a'), { status: 'unavailable' });
  globalThis.TURBOPACK = {
    push() {
      throw Error('not ready');
    },
  };
  assert.deepEqual(await api.getLoaded('a'), { status: 'unavailable' });
  await assert.rejects(api.getLoaded(''), /message ID/);
  await assert.rejects(api.getLoaded(42), /message ID/);
  // Shape observed in authenticated Yapin on 2026-11-22 (synthetic values).
  const message = {
    id: 'a',
    content: '',
    author_id: 'author',
    channel_id: 'channel',
    created_at: '2026-11-01T02:57:14.232669+00:00',
    attachment_path: 'author/file.txt',
    attachment_name: 'file.txt',
    attachment_size: 4927,
    attachment_width: null,
    attachment_height: null,
    system: { private: true },
  };
  const state = { messages: { channel: [message] }, extraMessages: {}, profiles: {} };
  const store = {
    getState: () => state,
    findMessage(id) {
      for (const messages of Object.values(state.messages)) {
        const found = messages.find((candidate) => candidate.id === id);
        if (found) return found;
      }
      return state.extraMessages[id];
    },
  };
  const host = { c: new Map([[1, { exports: store }]]) };
  let boot;
  globalThis.TURBOPACK = {
    push(chunk) {
      if (typeof chunk[2] === 'function') boot = chunk[2];
      else boot(host);
    },
  };
  const result = await api.getLoaded('a');
  assert.equal(result.status, 'found');
  assert.deepEqual(result.message, {
    id: 'a',
    text: '',
    authorId: 'author',
    channelId: 'channel',
    createdAt: message.created_at,
    attachments: [
      {
        path: 'author/file.txt',
        name: 'file.txt',
        size: 4927,
        width: undefined,
        height: undefined,
      },
    ],
  });
  assert.throws(() => {
    result.message.attachments[0].name = 'changed';
  }, TypeError);
  assert.throws(() => {
    result.message.attachments.push({ path: 'bad' });
  }, TypeError);
  message.content = 'edited';
  message.attachment_name = 'renamed';
  assert.equal(result.message.text, '');
  assert.equal(result.message.attachments[0].name, 'file.txt');
  assert.equal((await api.getLoaded('a')).message.text, 'edited');
  assert.deepEqual(await api.getLoaded('missing'), { status: 'not-loaded' });
  state.extraMessages.b = { id: 'b', attachment_path: null };
  assert.deepEqual((await api.getLoaded('b')).message.attachments, []);
  state.extraMessages.c = {
    id: 'c',
    content: 5,
    author_id: {},
    channel_id: '',
    created_at: 'bad',
    attachment_path: [],
  };
  assert.deepEqual((await api.getLoaded('c')).message, {
    id: 'c',
    text: undefined,
    authorId: undefined,
    channelId: undefined,
    createdAt: undefined,
    attachments: undefined,
  });
  state.extraMessages.d = { id: 'different' };
  assert.deepEqual(await api.getLoaded('d'), { status: 'unavailable' });
  state.extraMessages.e = {
    id: 'e',
    attachment_path: 'author/image.png',
    attachment_size: -1,
    attachment_width: Infinity,
    attachment_height: '20',
  };
  assert.deepEqual((await api.getLoaded('e')).message.attachments, [
    {
      path: 'author/image.png',
      name: undefined,
      size: undefined,
      width: undefined,
      height: undefined,
    },
  ]);
  const find = store.findMessage;
  store.findMessage = () => {
    throw Error('host failure');
  };
  assert.deepEqual(await api.getLoaded('a'), { status: 'unavailable' });
  store.findMessage = find;
  host.c.clear();
  assert.deepEqual(await api.getLoaded('a'), { status: 'unavailable' });
  host.c.set(0, {
    exports: {
      getState() {
        throw Error('unrelated');
      },
      findMessage() {},
    },
  });
  host.c.set(1, { exports: store });
  assert.equal((await api.getLoaded('a')).status, 'found');
  const dom = new JSDOM(
    '<section class="chat"><div class="messages"><article class="msg" data-message-id="a">Message</article></div></section>',
    { pretendToBeVisual: true },
  );
  t.after(() => dom.window.close());
  for (const key of [
    'document',
    'Element',
    'Node',
    'MutationObserver',
    'AbortController',
    'PointerEvent',
    'requestAnimationFrame',
  ]) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === 'requestAnimationFrame'
          ? dom.window.requestAnimationFrame.bind(dom.window)
          : dom.window[key],
    });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  const { registerMessageAction } = await server.ssrLoadModule('/src/features/plugins/menus.ts');
  const selected = [];
  scope.onDispose(
    registerMessageAction('message-test', {
      id: 'inspect',
      label: 'Inspect loaded message',
      async onSelect({ messageId }) {
        selected.push(await api.getLoaded(messageId));
      },
    }),
  );
  const row = document.querySelector('.msg');
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.setAttribute('role', 'menu');
  row.addEventListener('contextmenu', () => document.querySelector('.chat').append(menu));
  row.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true }));
  await settle();
  document.querySelector('.yp-message-action').click();
  await settle();
  assert.equal(selected[0].status, 'found');
  assert.equal(selected[0].message.id, 'a');
  row.dataset.messageId = 'not-in-cache';
  row.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true }));
  await settle();
  document.querySelector('.yp-message-action').click();
  await settle();
  assert.deepEqual(selected[1], { status: 'not-loaded' });
  row.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true }));
  await settle();
  assert.ok(document.querySelector('.yp-message-action'));
  const pending = api.getLoaded('a');
  scope.dispose();
  assert.equal(document.querySelector('.yp-message-action'), null);
  await assert.rejects(pending, /disposed/);
  await assert.rejects(api.getLoaded('a'), /disposed/);
});
