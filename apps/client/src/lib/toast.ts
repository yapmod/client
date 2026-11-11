type ToastKind = 'success' | 'error';

let toast: HTMLDivElement | undefined;
let timeout: ReturnType<typeof setTimeout> | undefined;

function removeToast(): void {
  if (timeout !== undefined) {
    globalThis.clearTimeout(timeout);
    timeout = undefined;
  }

  toast?.remove();
  toast = undefined;
}

/**
 * Shows a short-lived message with Yapin's own `.toast` markup. Only one
 * message is visible at a time, which keeps plugin actions from stacking
 * notifications over the settings modal.
 */
export function showToast(message: string, kind: ToastKind = 'success'): void {
  removeToast();

  const element = document.createElement('div');
  element.className = kind === 'error' ? 'toast toast-error' : 'toast toast-success';
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');

  const text = document.createElement('div');
  text.className = 'toast-text';
  text.textContent = message;
  element.append(text);

  document.body.append(element);
  toast = element;
  timeout = globalThis.setTimeout(removeToast, 3200);
}

/** Removes the current toast when the client is disposed. */
export function disposeToasts(): void {
  removeToast();
}
