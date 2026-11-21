import type { ChatLocationContext, DockedPanelOptions, LocationAction } from '@yapmod/types';
import { Button, Icon, appendStyle, isIconSource } from '@yapmod/ui';
import { ErrorBoundary } from 'solid-js';
import { render } from 'solid-js/web';
import { showToast } from '../../lib/toast';
import css from './locations.css?inline';

export function validateLocationAction<C>(action: LocationAction<C>) {
  if (
    !action ||
    typeof action.id !== 'string' ||
    !action.id.trim() ||
    typeof action.label !== 'string' ||
    !action.label.trim() ||
    typeof action.onSelect !== 'function' ||
    (action.visible !== undefined && typeof action.visible !== 'function') ||
    (action.icon !== undefined && !isIconSource(action.icon))
  )
    throw new TypeError('Invalid UI location action.');
}

export function locationError(plugin: string, label: string, error: unknown) {
  console.error(`[yapmod] UI extension failed for ${plugin}`, error);
  showToast(`Could not run ${label}.`, 'error');
}

export function locationVisible<C>(plugin: string, action: LocationAction<C>, context: C) {
  try {
    return action.visible?.(context) ?? true;
  } catch (error) {
    console.error(`[yapmod] UI visibility failed for ${plugin}`, error);
    return false;
  }
}

export function currentChat(root: ParentNode = document): HTMLElement | null {
  return root.querySelector('.chat-wrap > .chat > .messages[data-chat]');
}

interface Mount {
  host: HTMLElement;
  dispose(): void;
  context: string;
  chat: HTMLElement | null;
}
const registrations = new Map<string, () => void>();

/** One observer per registration; no host internals or arbitrary plugin selectors are exposed. */
export function registerLocation<C extends ChatLocationContext | Readonly<Record<string, never>>>(
  plugin: string,
  location: 'header' | 'sidebar',
  action: LocationAction<C>,
): () => void {
  validateLocationAction(action);
  action = { ...action };
  const key = JSON.stringify([plugin, location, action.id]);
  if (registrations.has(key)) throw new Error(`Duplicate ${location} action: ${action.id}`);
  let active = true;
  let mount: Mount | undefined;
  const style = appendStyle(css);
  function clear() {
    const old = mount;
    mount = undefined;
    old?.dispose();
    old?.host.remove();
  }
  function sync() {
    if (!active) return;
    const anchor = document.querySelector<HTMLElement>(
      location === 'header' ? '.main-head' : '.sidebar[aria-label="Channels"] > .sidebar-scroll',
    );
    const chat = location === 'header' ? currentChat(anchor?.parentElement ?? document) : null;
    const chatId = chat?.dataset.chat;
    const context = Object.freeze(location === 'header' ? { chatId: chatId ?? '' } : {}) as C;
    const identity = JSON.stringify(context);
    if (
      !anchor ||
      (location === 'header' && !chatId) ||
      !locationVisible(plugin, action, context)
    ) {
      clear();
      return;
    }
    if (
      mount &&
      (mount.host.parentElement !== anchor || mount.context !== identity || mount.chat !== chat)
    )
      clear();
    if (mount) return;
    const host = document.createElement('div');
    host.className = `yp-location yp-location-${location}`;
    host.dataset.ypLocation = key;
    anchor.append(host);
    const valid = () =>
      active &&
      mount?.host === host &&
      host.parentElement === anchor &&
      anchor.isConnected &&
      (location !== 'header' ||
        (chat?.isConnected &&
          chat.dataset.chat === chatId &&
          currentChat(anchor.parentElement ?? document) === chat));
    const dispose = render(
      () => (
        <Button
          size="small"
          variant="ghost"
          onClick={() => {
            if (!valid() || !locationVisible(plugin, action, context)) return;
            try {
              void Promise.resolve(action.onSelect(context)).catch((error) =>
                locationError(plugin, action.label, error),
              );
            } catch (error) {
              locationError(plugin, action.label, error);
            }
          }}
        >
          {action.icon && <Icon name={action.icon} />}
          {action.label}
        </Button>
      ),
      host,
    );
    mount = { host, dispose, context: identity, chat };
  }
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-chat', 'aria-label'],
  });
  const stop = () => {
    if (!active) return;
    active = false;
    observer.disconnect();
    clear();
    style.remove();
    registrations.delete(key);
  };
  registrations.set(key, stop);
  sync();
  return stop;
}

const panels = new Map<string, () => void>();
export function openDockedPanel(plugin: string, options: DockedPanelOptions): () => void {
  if (
    !options ||
    typeof options.id !== 'string' ||
    !options.id.trim() ||
    typeof options.title !== 'string' ||
    !options.title.trim() ||
    typeof options.render !== 'function'
  )
    throw new TypeError('A panel requires an ID, title and render function.');
  const key = JSON.stringify([plugin, options.id]);
  if (panels.has(key)) throw new Error(`Panel already open: ${options.id}`);
  const chat = currentChat();
  const wrap = chat?.closest('.chat-wrap');
  if (!chat?.dataset.chat || !wrap) return () => {};
  const context = Object.freeze({ chatId: chat.dataset.chat });
  const trigger = document.activeElement;
  const host = document.createElement('aside');
  host.className = 'yp-docked-panel';
  host.dataset.ypPanel = key;
  host.setAttribute('aria-label', options.title);
  host.tabIndex = -1;
  const style = appendStyle(css);
  let dispose: (() => void) | undefined;
  let closed = false;
  const observer = new MutationObserver(() => {
    if (
      !chat.isConnected ||
      chat.dataset.chat !== context.chatId ||
      host.parentElement !== wrap ||
      currentChat() !== chat
    )
      close();
  });
  function close() {
    if (closed) return;
    closed = true;
    observer.disconnect();
    try {
      dispose?.();
    } finally {
      host.remove();
      style.remove();
      panels.delete(key);
    }
    if (trigger instanceof HTMLElement && trigger.isConnected)
      trigger.focus({ preventScroll: true });
  }
  panels.set(key, close);
  wrap.append(host);
  dispose = render(
    () => (
      <ErrorBoundary
        fallback={(error) => {
          locationError(plugin, options.title, error);
          queueMicrotask(close);
          return <p>Could not open panel.</p>;
        }}
      >
        <div class="yp-docked-head">
          <strong>{options.title}</strong>
          <Button
            size="small"
            variant="ghost"
            aria-label={`Close ${options.title}`}
            onClick={close}
          >
            Close
          </Button>
        </div>
        <div class="yp-docked-content">{options.render(context, close)}</div>
      </ErrorBoundary>
    ),
    host,
  );
  if (closed) {
    dispose();
    return close;
  }
  host.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-chat'],
  });
  host.focus({ preventScroll: true });
  return close;
}
