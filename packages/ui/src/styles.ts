// oxlint-disable-next-line typescript/triple-slash-reference -- must pull in the ambient `?inline` CSS module types for every consumer of this package
/// <reference path="./vite-env.d.ts" />
import baseCss from './styles/base.css?inline';

/** The bundled component stylesheet, as shipped in the JavaScript bundle. */
export const uiCss = baseCss;

/**
 * Adds a `<style>` element with the given id, unless one is already there.
 *
 * Styles travel inside the JavaScript bundle (Vite `?inline`), so the
 * distributed client never ships a separate CSS file. Features use this for
 * the few rules that must live in the document because they target the host
 * page's own elements.
 */
export function injectStyle(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.append(style);
}

/** Removes a stylesheet added by `injectStyle`. Safe to call repeatedly. */
export function removeStyle(id: string): void {
  document.getElementById(id)?.remove();
}

/**
 * Injects the component stylesheet into the document.
 *
 * Components render in the light DOM by default, so this document copy is
 * what styles them. `mountIsolated` can still mount a view into a shadow
 * root and copies the same stylesheet inside it.
 */
export function injectStyles(): void {
  injectStyle('yapmod-ui-styles', uiCss);
}

/** Removes the document copy of the component stylesheet. */
export function removeStyles(): void {
  removeStyle('yapmod-ui-styles');
}
