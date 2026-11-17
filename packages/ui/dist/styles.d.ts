/** The bundled component stylesheet, as shipped in the JavaScript bundle. */
export declare const uiCss: string;
/**
 * Adds a `<style>` element with the given id, unless one is already there.
 *
 * Styles travel inside the JavaScript bundle (Vite `?inline`), so the
 * distributed client never ships a separate CSS file. Features use this for
 * the few rules that must live in the document because they target the host
 * page's own elements.
 */
export declare function injectStyle(id: string, css: string): void;
/** Removes a stylesheet added by `injectStyle`. Safe to call repeatedly. */
export declare function removeStyle(id: string): void;
/**
 * Injects the component stylesheet into the document.
 *
 * Components render in the light DOM by default, so this document copy is
 * what styles them. `mountIsolated` can still mount a view into a shadow
 * root and copies the same stylesheet inside it.
 */
export declare function injectStyles(): void;
/** Removes the document copy of the component stylesheet. */
export declare function removeStyles(): void;
