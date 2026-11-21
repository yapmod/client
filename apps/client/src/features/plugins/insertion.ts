import { composerChannelId } from './composer-context';
import type { ComposerInsertResult, ComposerToolContext } from '@yapmod/types';

/** One tracker per tool watcher; contexts cannot outlive its registrations. */
export function trackComposerTargets() {
  let active = true;
  let navigation = 0;
  const removals = new WeakMap<Node, number>();
  const recordRemovals = (records: MutationRecord[]) => {
    for (const record of records) {
      for (const node of record.removedNodes) removals.set(node, (removals.get(node) ?? 0) + 1);
    }
  };
  const observer = new MutationObserver(recordRemovals);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const navigate = () => navigation++;
  globalThis.addEventListener('popstate', navigate);
  globalThis.addEventListener('hashchange', navigate);
  // pushState/replaceState do not emit popstate. Track even a switch away and back.
  const history = globalThis.history;
  const push = history.pushState;
  const replace = history.replaceState;
  const pushState: History['pushState'] = function (this: History, ...args) {
    const result = push.apply(this, args);
    navigate();
    return result;
  };
  const replaceState: History['replaceState'] = function (this: History, ...args) {
    const result = replace.apply(this, args);
    navigate();
    return result;
  };
  history.pushState = pushState;
  history.replaceState = replaceState;

  return {
    capture(input: HTMLTextAreaElement, box: HTMLElement, registered: () => boolean) {
      recordRemovals(observer.takeRecords());
      const ancestors: Array<[Node, number]> = [];
      for (let node: Node | null = input; node; node = node.parentNode) {
        ancestors.push([node, removals.get(node) ?? 0]);
      }
      const route = globalThis.location.href;
      const revision = navigation;
      const channelId = composerChannelId(input);
      const draft = input.value;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const valid = () => {
        recordRemovals(observer.takeRecords());
        return (
          active &&
          registered() &&
          revision === navigation &&
          route === globalThis.location.href &&
          composerChannelId(input) === channelId &&
          input.isConnected &&
          box.isConnected &&
          box.querySelector('textarea') === input &&
          ancestors.every(
            ([node, version], index) =>
              (removals.get(node) ?? 0) === version &&
              (index === ancestors.length - 1 || node.parentNode === ancestors[index + 1]?.[0]),
          )
        );
      };
      function replaceText(text: string, from: number, to: number): ComposerInsertResult {
        if (!valid()) return { ok: false, reason: 'stale-target' };
        if (input.value !== draft) return { ok: false, reason: 'draft-changed' };
        if (input.disabled || input.readOnly) return { ok: false, reason: 'not-editable' };
        if (typeof text !== 'string') throw new TypeError('Composer replacement expects a string.');
        // Textareas normalize line endings; measure the value React will receive.
        const normalized = text.replace(/\r\n?/g, '\n');
        const value = draft.slice(0, from) + normalized + draft.slice(to);
        if (input.maxLength >= 0 && value.length > input.maxLength) {
          return { ok: false, reason: 'max-length' };
        }
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
        if (!setter) return { ok: false, reason: 'not-editable' };
        // Bypass React's instance value tracker so its onChange sees a real change.
        setter.call(input, value);
        input.setSelectionRange(from + normalized.length, from + normalized.length);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return { ok: true };
      }
      const context: ComposerToolContext = {
        draft,
        selection: Object.freeze({ start, end }),
        channelId,
        length: draft.length,
        maxLength: input.maxLength < 0 ? null : input.maxLength,
        focus() {
          if (valid()) input.focus({ preventScroll: true });
        },
        insertText: (text) => replaceText(text, start, end),
        replaceSelection: (text) => replaceText(text, start, end),
        replaceDraft: (text) => replaceText(text, 0, draft.length),
      };
      return Object.freeze(context);
    },
    dispose() {
      active = false;
      observer.disconnect();
      globalThis.removeEventListener('popstate', navigate);
      globalThis.removeEventListener('hashchange', navigate);
      if (history.pushState === pushState) history.pushState = push;
      if (history.replaceState === replaceState) history.replaceState = replace;
    },
  };
}
