import type { ComposerStatus, ComposerStatusState } from '@yapmod/types';

const selector = '.composer textarea, .composer-box textarea, textarea.msg-input';
type Formatter = (state: ComposerStatusState) => ComposerStatus;

interface Registration {
  pluginId: string;
  format: Formatter;
}

interface Row {
  element: HTMLElement;
  slots: Map<Registration, HTMLElement>;
  state?: ComposerStatusState;
}

const registrations = new Set<Registration>();
const rows = new Map<HTMLTextAreaElement, Row>();
let stopWatching: (() => void) | undefined;

function update(input: HTMLTextAreaElement, row: Row) {
  const length = input.value.length;
  const maxLength = input.maxLength < 0 ? null : input.maxLength;
  const previous = row.state;
  const state =
    previous && previous.length === length && previous.maxLength === maxLength
      ? previous
      : Object.freeze({ length, maxLength });
  const changed = state !== previous;
  row.state = state;
  for (const entry of registrations) {
    let slot = row.slots.get(entry);
    if (slot && !changed) continue;
    if (!slot) {
      slot = document.createElement('span');
      row.slots.set(entry, slot);
      row.element.append(slot);
    }
    try {
      const result = entry.format(state);
      slot.textContent = typeof result === 'string' ? result : result.text;
      slot.style.color =
        typeof result !== 'string' && result.tone === 'warning' ? 'var(--danger, #c44)' : '';
    } catch (error) {
      slot.textContent = '';
      console.error(`[yapmod] composer status failed for ${entry.pluginId}`, error);
    }
  }
}

function addComposer(element: Element) {
  if (!(element instanceof HTMLTextAreaElement) || rows.has(element)) return;
  const row = document.createElement('div');
  row.className = 'yp-composer-status';
  rows.set(element, { element: row, slots: new Map() });
}

function discover(root: Element | Document) {
  if (root instanceof Element && root.matches(selector)) addComposer(root);
  for (const input of root.querySelectorAll(selector)) addComposer(input);
}

function refresh() {
  for (const [input, row] of rows) {
    if (!input.isConnected || !input.matches(selector)) {
      row.element.remove();
      rows.delete(input);
      continue;
    }
    // Keep the host's Send button and composer tools together on their original line.
    const box = input.closest('.composer-box');
    const anchor = box?.querySelector('textarea') === input ? box : input;
    if (anchor.nextElementSibling !== row.element) anchor.after(row.element);
    update(input, row);
  }
}

function watch() {
  const events = new AbortController();
  const options = { capture: true, signal: events.signal };
  let frame: number | undefined;
  function afterHostUpdate() {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      refresh();
    });
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) discover(node);
      }
    }
    refresh();
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['maxlength'],
  });
  document.addEventListener(
    'input',
    (event) => {
      if (!(event.target instanceof HTMLTextAreaElement)) return;
      const row = rows.get(event.target);
      if (row) update(event.target, row);
    },
    options,
  );
  document.addEventListener('reset', afterHostUpdate, options);
  document.addEventListener('submit', afterHostUpdate, options);
  document.addEventListener(
    'keyup',
    (event) => {
      if (event.key === 'Enter') afterHostUpdate();
    },
    options,
  );
  discover(document);
  return () => {
    observer.disconnect();
    events.abort();
    if (frame !== undefined) cancelAnimationFrame(frame);
    for (const row of rows.values()) row.element.remove();
    rows.clear();
  };
}

export function registerComposerStatus(pluginId: string, format: Formatter): () => void {
  const entry = { pluginId, format };
  registrations.add(entry);
  stopWatching ??= watch();
  refresh();
  return () => {
    if (!registrations.delete(entry)) return;
    for (const row of rows.values()) {
      row.slots.get(entry)?.remove();
      row.slots.delete(entry);
    }
    if (!registrations.size) {
      stopWatching?.();
      stopWatching = undefined;
    }
  };
}
