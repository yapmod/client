import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('composer insertion synchronizes React and rejects unsafe targets', async (t) => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://yapin.test/channel/one' });
  const globals = [
    'window',
    'document',
    'navigator',
    'HTMLTextAreaElement',
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
  function Composer() {
    const [draft, update] = useState('hello world');
    setDraft = update;
    state = draft;
    return createElement(
      'form',
      { onSubmit: () => submits++ },
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
  flushSync(() => root.render(createElement(Composer)));
  const tracker = trackComposerTargets();
  try {
    const input = document.querySelector('textarea');
    const box = input.parentElement;
    let registered = true;
    const capture = () => tracker.capture(input, box, () => registered);
    const fail = (context, text, reason) => {
      const before = input.value;
      assert.deepEqual(context.insertText(text), { ok: false, reason });
      assert.equal(input.value, before);
    };
    input.setSelectionRange(6, 11);
    const context = capture();
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
    await server.close();
    dom.window.close();
  }
});
