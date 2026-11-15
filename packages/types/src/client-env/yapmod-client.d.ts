/**
 * Global declaration for `globalThis.YapmodClient`.
 *
 * The client runtime exposes a handle on `globalThis.YapmodClient` so
 * external consumers (browser extensions, embedders) can access the
 * shared SolidJS instances, UI components, and lifecycle state.
 *
 * Include this declaration in your TypeScript config to get the type:
 *
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@yapmod/types/client-env"]
 *   }
 * }
 * ```
 *
 * @module
 */
declare global {
  var YapmodClient: import('../client').ClientHandle | undefined;
}

export {};
