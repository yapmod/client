import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { uiCss } from './styles';

/**
 * Renders a view into a shadow root of `host`, with Yapmod's component
 * stylesheet mounted inside it.
 *
 * This is an optional isolation boundary. Most views render in the light DOM
 * (with `render` from `solid-js/web`) so the host page's layout and theme
 * apply; use this only when a view must not be affected by host CSS.
 *
 * A shadow root is a hard boundary: the host page's CSS cannot reach the
 * view, and the view's CSS cannot leak out. Everything rendered here is
 * styled exclusively by the bundle's own stylesheet, so the UI is fully
 * independent of the page it is injected into.
 *
 * Returns a disposer that unmounts the view and removes the stylesheet.
 */
export function mountIsolated(host: HTMLElement, view: () => JSX.Element): () => void {
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = uiCss;
  root.append(style);

  const unmount = render(view, root);

  return () => {
    unmount();
    style.remove();
  };
}
