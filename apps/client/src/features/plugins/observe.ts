/**
 * Watches the page for elements matching a CSS selector.
 *
 * The callback fires once per element: for everything already in the page
 * when the observer starts, and for each element added later. A `WeakSet`
 * remembers what was reported, so moving an element around does not fire
 * twice — and removed nodes are not kept alive by the observer.
 *
 * Only insertions are watched. Yapin rebuilds its interface by replacing
 * nodes, which always shows up as an addition, so watching attributes as
 * well would cost a lot of observation for no extra coverage.
 *
 * The returned disposer disconnects the observer.
 */
export function observeElements(selector: string, onFound: (element: Element) => void): () => void {
  // A malformed selector is a plugin bug; fail where it is written instead
  // of inside the MutationObserver callback, where the error would be easy
  // to miss and repeat on every mutation.
  try {
    document.querySelector(selector);
  } catch {
    throw new Error(`observe(): invalid selector "${selector}"`);
  }

  const seen = new WeakSet<Element>();

  function fire(element: Element): void {
    if (seen.has(element)) return;
    seen.add(element);
    onFound(element);
  }

  function consider(root: ParentNode): void {
    if (root instanceof Element && root.matches(selector)) fire(root);
    for (const match of root.querySelectorAll(selector)) fire(match);
  }

  consider(document);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) consider(node);
      }
    }
  });

  observer.observe(document.documentElement ?? document, { childList: true, subtree: true });
  return () => observer.disconnect();
}
