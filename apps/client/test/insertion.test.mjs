import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const nativeCommands = () => [{ name: 'native', prefix: '/' }];

test('composer insertion synchronizes React and rejects unsafe targets', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://yapin.test/channel/one' });
  const globals = [
    'window',
    'document',
    'navigator',
    'HTMLTextAreaElement',
    'Element',
    'AbortController',
    'KeyboardEvent',
    'MutationObserver',
    'Event',
    'history',
    'location',
  ];
  for (const name of globals) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  for (const name of ['addEventListener', 'removeEventListener']) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: dom.window[name].bind(dom.window),
    });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const { createElement, useState } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { flushSync } = await import('react-dom');
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
  });
  const { trackComposerTargets } = await server.ssrLoadModule('/src/features/plugins/insertion.ts');
  const root = createRoot(document.querySelector('#root'));
  let setDraft;
  let state;
  let changes = 0;
  let submits = 0;
  const reply = { id: 'reply', text: 'Keep this reply' };
  const files = [];
  let setChannel;
  function Conversation() {
    const [channelId, update] = useState('one');
    setChannel = update;
    return createElement(Channel, { channelId });
  }
  function Channel({ channelId }) {
    return createElement(Composer, {
      draftKey: channelId,
      onSend: () => submits++,
      commands: nativeCommands,
      chip: reply,
      files,
    });
  }
  function Composer() {
    const [draft, update] = useState('hello world');
    setDraft = update;
    state = draft;
    return createElement(
      'form',
      { className: 'composer', onSubmit: () => submits++ },
      createElement(
        'div',
        { className: 'composer-box' },
        createElement('textarea', {
          value: draft,
          maxLength: 20,
          onChange: (event) => {
            changes++;
            update(event.target.value);
          },
        }),
      ),
    );
  }
  flushSync(() => root.render(createElement(Conversation)));
  const tracker = trackComposerTargets();
  try {
    const { composerChannelId, composerProps } = await server.ssrLoadModule(
      '/src/features/plugins/composer-context.ts',
    );
    const unknown = document.createElement('textarea');
    assert.equal(composerChannelId(unknown), null);
    const fiberKey = `__reactFiber$test`;
    unknown[fiberKey] = {
      memoizedProps: {},
      return: {
        memoizedProps: { draftKey: 'one', onSend() {} },
        return: { memoizedProps: { channelId: 'different' } },
      },
    };
    assert.equal(composerChannelId(unknown), null, 'mismatched host identity fails closed');
    unknown[fiberKey].return.memoizedProps.draftKey = 123;
    assert.equal(composerChannelId(unknown), null, 'invalid host identity fails closed');
    const input = document.querySelector('textarea');
    const box = input.parentElement;
    let registered = true;
    const capture = () => tracker.capture(input, box, () => registered);
    const fail = (context, text, reason) => {
      const before = input.value;
      for (const method of ['insertText', 'replaceSelection', 'replaceDraft']) {
        assert.deepEqual(
          context[method](
            method === 'replaceDraft' && reason === 'max-length' ? text.repeat(30) : text,
          ),
          { ok: false, reason },
        );
      }
      assert.equal(input.value, before);
    };
    input.setSelectionRange(6, 11);
    const context = capture();
    assert.equal(context.draft, 'hello world');
    assert.deepEqual(context.selection, { start: 6, end: 11 });
    assert.equal(context.channelId, 'one');
    assert.ok(Object.isFrozen(context));
    assert.ok(Object.isFrozen(context.selection));
    input.setSelectionRange(0, 0); // Selection at activation wins, including modal focus changes.
    flushSync(() => assert.deepEqual(context.insertText('friend'), { ok: true }));
    assert.equal(state, 'hello friend');
    assert.equal(changes, 1, 'React onChange must observe the native setter');
    assert.equal(input.selectionStart, 12);
    fail(context, 'again', 'draft-changed');
    const changed = capture();
    flushSync(() => setDraft('another draft'));
    fail(changed, 'oops', 'draft-changed');

    flushSync(() => setDraft('hello'));
    input.setSelectionRange(5, 5);
    input.maxLength = 6;
    fail(capture(), '😀', 'max-length');
    input.maxLength = 7;
    flushSync(() => assert.deepEqual(capture().insertText('😀'), { ok: true }));
    assert.equal(state, 'hello😀');
    input.readOnly = true;
    fail(capture(), 'x', 'not-editable');
    input.readOnly = false;
    input.disabled = true;
    fail(capture(), 'x', 'not-editable');
    input.disabled = false;
    input.removeAttribute('maxlength');
    input.setSelectionRange(0, input.value.length);
    flushSync(() => assert.deepEqual(capture().insertText('a\r\nb\rc'), { ok: true }));
    assert.equal(state, 'a\nb\nc');

    flushSync(() => setDraft('a😀z'));
    input.setSelectionRange(1, 3);
    const unicode = capture();
    assert.equal(unicode.draft.slice(unicode.selection.start, unicode.selection.end), '😀');
    flushSync(() => assert.deepEqual(unicode.replaceSelection('🎉'), { ok: true }));
    assert.equal(state, 'a🎉z');
    assert.equal(input.selectionStart, 3);
    flushSync(() => assert.deepEqual(capture().replaceDraft('template\r\n😀'), { ok: true }));
    assert.equal(state, 'template\n😀');
    const asyncDraft = capture();
    await Promise.resolve();
    flushSync(() => setDraft('typed while waiting'));
    fail(asyncDraft, 'rewrite', 'draft-changed');
    const oldChannel = capture();
    flushSync(() => setChannel('two'));
    assert.equal(capture().channelId, 'two', 'use committed React props after navigation');
    fail(oldChannel, 'rewrite', 'stale-target');
    assert.equal(oldChannel.channelId, 'one');

    const { registerCommand } = await server.ssrLoadModule('/src/features/plugins/commands.ts');
    let commandContext;
    const unregister = registerCommand('test', {
      name: 'contexttest',
      description: 'Capture context',
      execute(command) {
        commandContext = command;
      },
    });
    flushSync(() => setDraft('/contexttest hello'));
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    flushSync(() => input.dispatchEvent(enter));
    assert.ok(enter.defaultPrevented);
    assert.equal(commandContext.args, 'hello');
    assert.equal(commandContext.channelId, 'two');
    assert.equal(state, '', 'command clear updates React so slash text cannot leak');
    assert.equal(submits, 0);
    unregister();
    assert.ok(commandContext.signal.aborted);
    for (const props of composerProps(input)) {
      assert.equal(props.commands, nativeCommands, 'restore host suggestion provider');
      assert.equal(props.files, files, 'preserve host attachments');
      assert.equal(props.chip, reply, 'preserve host reply');
    }

    const navigated = capture();
    history.pushState({}, '', '/channel/two');
    history.replaceState({}, '', '/channel/one');
    fail(navigated, 'x', 'stale-target');
    const popped = capture();
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
    fail(popped, 'x', 'stale-target');
    const removed = capture();
    input.remove();
    box.append(input); // Reject even before MutationObserver's microtask runs.
    fail(removed, 'x', 'stale-target');
    const ancestorRemoved = capture();
    const form = box.parentElement;
    box.remove();
    form.append(box);
    fail(ancestorRemoved, 'x', 'stale-target');
    const replaced = capture();
    const other = document.createElement('textarea');
    other.value = 'other conversation';
    input.replaceWith(other);
    fail(replaced, 'x', 'stale-target');
    assert.equal(other.value, 'other conversation');
    other.replaceWith(input);
    const unregistered = capture();
    registered = false;
    fail(unregistered, 'x', 'stale-target');
    registered = true;
    const disposed = capture();
    tracker.dispose();
    fail(disposed, 'x', 'stale-target');
    assert.equal(submits, 0);
  } finally {
    tracker.dispose();
    flushSync(() => root.unmount());
    await new Promise((resolve) => setTimeout(resolve, 30));
    await server.close();
    dom.window.close();
  }
});
