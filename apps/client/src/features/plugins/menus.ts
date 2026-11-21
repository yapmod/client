import { createIcon, iconPaths } from '@yapmod/ui';
import type { MessageMenuAction, MessageMenuContext } from '@yapmod/types';
import { showToast } from '../../lib/toast';

const messageSelector = '.messages .msg[data-message-id]:not([data-yp-ghost])';
const moreSelector = '.msg-actions button[aria-label="More"], .msg-actions button[title="More"]';

interface Entry {
  plugin: string;
  action: MessageMenuAction;
}

interface Session {
  row: HTMLElement;
  opener: HTMLElement;
  chat: HTMLElement;
  context: MessageMenuContext;
  observer: MutationObserver;
  menu?: HTMLElement;
  buttons: Map<Entry, HTMLButtonElement>;
}

const entries = new Map<string, Entry>();
let session: Session | undefined;
let listeners: AbortController | undefined;

function clearSession() {
  if (!session) return;
  session.observer.disconnect();
  for (const button of session.buttons.values()) button.remove();
  session = undefined;
}

function isCurrent(s: Session) {
  return (
    session === s &&
    s.row.isConnected &&
    s.row.closest('.chat') === s.chat &&
    s.row.dataset.messageId === s.context.messageId
  );
}

function isVisible(entry: Entry, context: MessageMenuContext) {
  try {
    return entry.action.visible?.(context) ?? true;
  } catch (error) {
    console.error(`[yapmod] context menu visibility failed for ${entry.plugin}`, error);
    return false;
  }
}

function dismiss(s: Session) {
  clearSession();
  // Yapin closes its React-owned menu on an outside pointerdown.
  document.body.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      pointerType: 'mouse',
      isPrimary: true,
    }),
  );
  if (s.opener.isConnected) {
    const hadTabIndex = s.opener.hasAttribute('tabindex');
    if (!hadTabIndex && s.opener.tabIndex < 0) s.opener.tabIndex = -1;
    s.opener.focus({ preventScroll: true });
    if (!hadTabIndex) s.opener.removeAttribute('tabindex');
  }
}

function reportError(entry: Entry, error: unknown) {
  console.error(`[yapmod] context menu action failed for ${entry.plugin}`, error);
  showToast(`Could not run ${entry.action.label}.`, 'error');
}

function createButton(s: Session, entry: Entry, menu: HTMLElement) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'menuitem');
  button.className = 'yp-message-action';
  const label = document.createElement('span');
  label.textContent = entry.action.label;
  button.append(label);
  if (entry.action.icon) button.append(createIcon(entry.action.icon));
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (
      !isCurrent(s) ||
      !menu.isConnected ||
      s.buttons.get(entry) !== button ||
      button.parentElement !== menu ||
      !isVisible(entry, s.context)
    )
      return;
    dismiss(s);
    try {
      void Promise.resolve(entry.action.onSelect(s.context)).catch((error: unknown) =>
        reportError(entry, error),
      );
    } catch (error) {
      reportError(entry, error);
    }
  });
  return button;
}

function refresh() {
  const s = session;
  if (!s) return;
  if (!isCurrent(s)) {
    clearSession();
    return;
  }
  const menu = s.chat.querySelector<HTMLElement>(':scope > .ctx-menu[role="menu"]');
  if (!menu || (s.menu && s.menu !== menu)) {
    if (s.menu) clearSession();
    return;
  }
  s.menu = menu;
  // Reinsert after native items in registration order, including when a hidden action reappears.
  let next: HTMLButtonElement | null = null;
  // oxlint-disable-next-line unicorn/no-array-reverse -- ES2020 lacks toReversed; reverse a fresh copy.
  for (const entry of [...entries.values()].reverse()) {
    let button = s.buttons.get(entry);
    if (!isVisible(entry, s.context)) {
      button?.remove();
      s.buttons.delete(entry);
      continue;
    }
    if (!button) {
      button = createButton(s, entry, menu);
      s.buttons.set(entry, button);
    }
    if (button.parentElement !== menu || button.nextElementSibling !== next)
      menu.insertBefore(button, next);
    next = button;
  }
}

function openFor(opener: Element) {
  clearSession();
  const row = opener.closest<HTMLElement>(messageSelector);
  const chat = row?.closest<HTMLElement>('.chat');
  if (!row?.dataset.messageId || !chat) return;
  const observer = new MutationObserver(refresh);
  const s: Session = {
    row,
    chat,
    opener: opener.closest<HTMLElement>('button') ?? row,
    context: Object.freeze({ messageId: row.dataset.messageId }),
    observer,
    buttons: new Map(),
  };
  session = s;
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-message-id'],
  });
  // React opens its menu after our capture listener. Also handle a reused menu, whose DOM may not change.
  queueMicrotask(refresh);
  requestAnimationFrame(() => {
    if (session === s && !s.menu) clearSession();
  });
}

function watch() {
  listeners = new AbortController();
  const options = { capture: true, signal: listeners.signal };
  document.addEventListener(
    'contextmenu',
    (event) => {
      const target = event.target;
      if (target instanceof Element && !target.closest('.msg-author, .mention, [role="menu"]'))
        openFor(target);
      else clearSession();
    },
    options,
  );
  document.addEventListener(
    'click',
    (event) => {
      const more = event.target instanceof Element && event.target.closest(moreSelector);
      if (more) openFor(more);
    },
    options,
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (session && event.target instanceof Node && !session.menu?.contains(event.target))
        clearSession();
    },
    options,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      const s = session;
      if (event.key === 'Escape' && s?.menu && isCurrent(s)) {
        dismiss(s);
        event.preventDefault();
        event.stopPropagation();
      }
    },
    options,
  );
}

export function registerMessageAction(plugin: string, action: MessageMenuAction): () => void {
  if (
    typeof action?.id !== 'string' ||
    !action.id.trim() ||
    typeof action.label !== 'string' ||
    !action.label.trim() ||
    typeof action.onSelect !== 'function' ||
    (action.visible !== undefined && typeof action.visible !== 'function') ||
    (action.icon !== undefined && !Object.keys(iconPaths).includes(action.icon))
  ) {
    throw new TypeError('Invalid message context menu action.');
  }
  const key = JSON.stringify([plugin, action.id]);
  if (entries.has(key)) throw new Error(`Duplicate context menu action: ${action.id}`);
  const entry = { plugin, action: { ...action } };
  entries.set(key, entry);
  if (!listeners) watch();
  refresh();
  return () => {
    if (entries.get(key) !== entry) return;
    entries.delete(key);
    session?.buttons.get(entry)?.remove();
    session?.buttons.delete(entry);
    if (!entries.size) {
      clearSession();
      listeners?.abort();
      listeners = undefined;
    }
  };
}
