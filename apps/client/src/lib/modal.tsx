import { Button, Icon } from '@yapmod/ui';
import { Show, onCleanup, onMount, type JSX } from 'solid-js';
import { render } from 'solid-js/web';

const openModals = new Set<() => void>();

interface ModalShellProps {
  title: string;
  description?: string;
  wide?: boolean;
  onClose: () => void;
  children: JSX.Element;
  footer?: JSX.Element;
}

function ModalShell(props: ModalShellProps): JSX.Element {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    props.onClose();
  };

  onMount(() => document.addEventListener('keydown', onKeyDown, true));
  onCleanup(() => document.removeEventListener('keydown', onKeyDown, true));

  return (
    <div
      class="overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      <div
        classList={{ modal: true, wide: props.wide, 'has-x': true }}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <button type="button" class="modal-x" aria-label="Close" onClick={props.onClose}>
          <Icon name="close" size={18} />
        </button>

        <div class="modal-head">
          <h2>{props.title}</h2>
          <Show when={props.description}>
            <p>{props.description}</p>
          </Show>
        </div>

        <div class="modal-body">{props.children}</div>

        <Show when={props.footer}>
          <div class="modal-foot">{props.footer}</div>
        </Show>
      </div>
    </div>
  );
}

interface OpenModalOptions {
  title: string;
  description?: string;
  wide?: boolean;
  content: (close: () => void) => JSX.Element;
  footer?: (close: () => void) => JSX.Element;
  onClose?: () => void;
}

/** Opens a modal with Yapin's own overlay and modal classes. */
export function openModal(options: OpenModalOptions): () => void {
  closeAllModals();

  const host = document.createElement('div');
  document.body.append(host);

  let closed = false;
  let dispose: (() => void) | undefined;

  const close = () => {
    if (closed) return;
    closed = true;
    openModals.delete(close);
    dispose?.();
    host.remove();
    options.onClose?.();
  };

  dispose = render(
    () => (
      <ModalShell
        title={options.title}
        description={options.description}
        wide={options.wide}
        onClose={close}
        footer={options.footer?.(close)}
      >
        {options.content(close)}
      </ModalShell>
    ),
    host,
  );

  openModals.add(close);

  queueMicrotask(() => {
    const target =
      host.querySelector<HTMLElement>('input, textarea, select') ??
      host.querySelector<HTMLElement>('.modal-foot .yp-btn:not(.yp-btn--ghost)') ??
      host.querySelector<HTMLElement>('.modal-x');
    target?.focus();
  });

  return close;
}

/** Closes every Yapmod modal that is currently open. */
export function closeAllModals(): void {
  for (const close of openModals) close();
}

interface ConfirmModalOptions {
  title: string;
  body: string;
  confirmText?: string;
  danger?: boolean;
}

/** Asks for confirmation before a destructive action. */
export function openConfirmModal(options: ConfirmModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    openModal({
      title: options.title,
      content: () => (
        <p class="hint" style={{ margin: '0' }}>
          {options.body}
        </p>
      ),
      footer: (close) => (
        <>
          <Button
            variant="ghost"
            onClick={() => {
              settled = true;
              close();
              resolve(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant={options.danger ? 'danger' : 'default'}
            onClick={() => {
              settled = true;
              close();
              resolve(true);
            }}
          >
            {options.confirmText ?? 'Confirm'}
          </Button>
        </>
      ),
      onClose: () => {
        if (!settled) resolve(false);
      },
    });
  });
}

interface ContentModalOptions {
  title: string;
  content: Node | string | undefined;
  wide?: boolean;
}

/** Shows a plugin-provided DOM node (or HTML string) in a host modal. */
export function openContentModal(options: ContentModalOptions): () => void {
  return openModal({
    title: options.title,
    wide: options.wide,
    content: () => (
      <div
        ref={(element) => {
          if (options.content === undefined) {
            element.className = 'hint';
            element.textContent = 'This plugin has no settings.';
          } else if (typeof options.content === 'string') {
            element.innerHTML = options.content;
          } else {
            element.append(options.content);
          }
        }}
      />
    ),
    footer: (close) => <Button onClick={close}>Done</Button>,
  });
}
