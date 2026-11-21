import type { ContextMenuTargets, LocationAction } from '@yapmod/types';
import { createIcon } from '@yapmod/ui';
import { locationError, locationVisible, validateLocationAction } from './locations';

const channelSelector = '.sidebar .channel-row[data-nav-chan]';
const userSelector = '.members-panel [data-vkey^="member:"]';
type Target = 'channel' | 'user';
const registrations = new Map<string, () => void>();
const noop = () => {};

export function registerLocationMenu<K extends Target>(
  plugin: string,
  target: K,
  action: LocationAction<ContextMenuTargets[K]>,
): () => void {
  validateLocationAction(action);
  action = { ...action };
  const key = JSON.stringify([plugin, target, action.id]);
  if (registrations.has(key)) throw new Error(`Duplicate ${target} menu action: ${action.id}`);
  let active = true;
  let clearSession = noop;
  const listeners = new AbortController();
  function open(event: MouseEvent) {
    clearSession();
    const row =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(target === 'channel' ? channelSelector : userSelector)
        : null;
    const identity = target === 'channel' ? row?.dataset.navChan : row?.dataset.vkey?.slice(7);
    if (!row || !identity) return;
    const context = Object.freeze(
      target === 'channel' ? { channelId: identity } : { userId: identity },
    ) as ContextMenuTargets[K];
    const owner = target === 'user' ? row.closest('.members-panel') : null;
    const previousMenus = new Set(document.querySelectorAll('.ctx-menu[role="menu"]'));
    let menu: Element | undefined;
    let button: HTMLButtonElement | undefined;
    let ended = false;
    const valid = () =>
      active &&
      !ended &&
      row.isConnected &&
      (target === 'channel'
        ? row.dataset.navChan === identity
        : row.dataset.vkey === `member:${identity}`);
    const observer = new MutationObserver(refresh);
    function clear() {
      ended = true;
      observer.disconnect();
      button?.remove();
    }
    clearSession = clear;
    function refresh() {
      if (!valid() || (menu && !menu.isConnected)) {
        clear();
        return;
      }
      const candidates =
        target === 'user'
          ? owner?.querySelectorAll(':scope > .ctx-menu[role="menu"]')
          : document.querySelectorAll('.overlay.clear > .ctx-menu[role="menu"]');
      const found = [...(candidates ?? [])].filter((node) => !previousMenus.has(node));
      if (!menu && found.length === 1) menu = found[0];
      if (!menu) return;
      if (!locationVisible(plugin, action, context)) {
        button?.remove();
        return;
      }
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.dataset.ypLocationMenu = key;
        const label = document.createElement('span');
        label.textContent = action.label;
        button.append(label);
        if (action.icon) button.append(createIcon(action.icon));
        button.addEventListener('click', (clickEvent) => {
          clickEvent.stopPropagation();
          if (
            !valid() ||
            !menu?.isConnected ||
            button?.parentElement !== menu ||
            !locationVisible(plugin, action, context)
          )
            return;
          clear();
          document.body.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, button: 0 }),
          );
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          row?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
          try {
            void Promise.resolve(action.onSelect(context)).catch((error) =>
              locationError(plugin, action.label, error),
            );
          } catch (error) {
            locationError(plugin, action.label, error);
          }
        });
      }
      if (button.parentElement !== menu) menu.append(button);
    }
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-nav-chan', 'data-vkey'],
    });
    queueMicrotask(refresh);
    requestAnimationFrame(() => {
      if (!menu) clear();
    });
  }
  const opts = { capture: true, signal: listeners.signal };
  document.addEventListener('contextmenu', open, opts);
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!(event.target instanceof Element) || !event.target.closest('.ctx-menu')) clearSession();
    },
    opts,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') clearSession();
    },
    opts,
  );
  const stop = () => {
    if (!active) return;
    active = false;
    clearSession();
    listeners.abort();
    registrations.delete(key);
  };
  registrations.set(key, stop);
  return stop;
}
