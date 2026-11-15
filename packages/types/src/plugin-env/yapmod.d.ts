/**
 * Global declaration for the `yapmod` free variable.
 *
 * The @yapmod/builder injects this variable at compile time so plugin code
 * can reference `yapmod` without importing anything. Add this package to
 * your tsconfig `types` array so the variable is typed automatically:
 *
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@yapmod/types/plugin-env"]
 *   }
 * }
 * ```
 *
 * @module
 */
declare const yapmod: import('../plugin').YapmodPluginApi;
