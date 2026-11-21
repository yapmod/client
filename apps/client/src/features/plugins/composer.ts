import type { ComposerStatus, ComposerStatusState, PluginComposer } from '@yapmod/types';
import { createComponent, createRenderEffect, ErrorBoundary, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';
import { render } from 'solid-js/web';

const selector = '.composer textarea, .composer-box textarea, textarea.msg-input';
type Block = Parameters<PluginComposer['registerBlock']>[0];

interface Registration {
  pluginId: string;
  block: Block;
}

interface Slot {
  host: HTMLElement;
  unmount?: () => void;
}

interface Row {
  element: HTMLElement;
  slots: Map<Registration, Slot>;
  state: ComposerStatusState;
  setState: (state: ComposerStatusState) => void;
}

const registrations = new Set<Registration>();
const rows = new Map<HTMLTextAreaElement, Row>();
let stopWatching: (() => void) | undefined;

function measurements(input: HTMLTextAreaElement): ComposerStatusState {
  return { length: input.value.length, maxLength: input.maxLength < 0 ? null : input.maxLength };
}

function removeSlot(row: Row, entry: Registration) {
  const slot = row.slots.get(entry);
  if (!slot) return;
  row.slots.delete(entry);
  try {
    slot.unmount?.();
  } catch (error) {
    console.error(`[yapmod] composer block cleanup failed for ${entry.pluginId}`, error);
  } finally {
    slot.host.remove();
  }
}

function removeRow(row: Row) {
  for (const entry of row.slots.keys()) removeSlot(row, entry);
  row.element.remove();
}

function update(input: HTMLTextAreaElement, row: Row) {
  row.setState(measurements(input));
  for (const entry of registrations) {
    if (row.slots.has(entry)) continue;
    const slot: Slot = { host: document.createElement('div') };
    row.slots.set(entry, slot);
    row.element.append(slot.host);
    // Each plugin owns a separate Solid root and boundary, including reactive updates after mount.
    slot.unmount = render(
      () =>
        createComponent(ErrorBoundary, {
          fallback: (error: unknown) => {
            console.error(`[yapmod] composer block failed for ${entry.pluginId}`, error);
            return null;
          },
          get children() {
            return untrack(() => entry.block(row.state));
          },
        }),
      slot.host,
    );
    // A plugin can unregister itself as another composer mounts.
    if (!row.slots.has(entry)) slot.unmount();
  }
}

function addComposer(element: Element) {
  if (
    !(element instanceof HTMLTextAreaElement) ||
    rows.has(element) ||
    element.closest('.yp-composer-status')
  )
    return;
  const row = document.createElement('div');
  row.className = 'yp-composer-status';
  const [state, setState] = createStore(measurements(element));
  rows.set(element, { element: row, slots: new Map(), state, setState });
}

function discover(root: Element | Document) {
  if (root instanceof Element && root.matches(selector)) addComposer(root);
  for (const input of root.querySelectorAll(selector)) addComposer(input);
}

function refresh() {
  for (const [input, row] of rows) {
    if (!input.isConnected || !input.matches(selector)) {
      removeRow(row);
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
    for (const row of rows.values()) removeRow(row);
    rows.clear();
  };
}

export function registerComposerBlock(pluginId: string, block: Block): () => void {
  const entry = { pluginId, block };
  registrations.add(entry);
  stopWatching ??= watch();
  refresh();
  return () => {
    if (!registrations.delete(entry)) return;
    for (const row of rows.values()) removeSlot(row, entry);
    if (!registrations.size) {
      stopWatching?.();
      stopWatching = undefined;
    }
  };
}

export function registerComposerStatus(
  pluginId: string,
  format: (state: ComposerStatusState) => ComposerStatus,
): () => void {
  return registerComposerBlock(pluginId, (state) => {
    const label = document.createElement('span');
    createRenderEffect(() => {
      // Formatters receive the original immutable snapshot and retry after a measurement changes.
      const snapshot = Object.freeze({ length: state.length, maxLength: state.maxLength });
      try {
        const result = untrack(() => format(snapshot));
        label.textContent = typeof result === 'string' ? result : result.text;
        label.style.color =
          typeof result !== 'string' && result.tone === 'warning' ? 'var(--danger, #c44)' : '';
      } catch (error) {
        label.textContent = '';
        console.error(`[yapmod] composer status failed for ${pluginId}`, error);
      }
    });
    return label;
  });
}
