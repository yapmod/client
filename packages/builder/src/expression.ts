/*
 * The expression form the client's plugin loader evaluates (see
 * apps/client/src/features/plugins/eval.ts): an immediately-invoked function
 * that runs the bundle and hands the plugin module back. The builder wraps
 * every bundle in exactly this shape, and bundler recipes reuse these
 * constants so their output loads unchanged.
 *
 * The wrapper takes no parameter: `yapmod` inside it resolves to the API
 * object the loader's own function provides. Wrapping after the bundler has
 * finished also matters — minifiers prune an uncalled top-level function
 * expression, which is why the wrapper is invoked and returns instead of
 * being handed to the loader as a function.
 */

/** Name bundlers assign to the bundle; the footer reads the exports back. */
export const EXPRESSION_GLOBAL_NAME = 'yapmodPlugin';

/** Opens the expression: runs the bundle in the loader's `yapmod` scope. */
export const expressionBanner = '(function () {\n';

/**
 * Closes the expression and returns the default export. Bundlers expose
 * `export default` as `<globalName>.default`; a function default reaches
 * the loader unchanged and is called with the API, so factories work too.
 */
export const expressionFooter = `
;const plugin = typeof ${EXPRESSION_GLOBAL_NAME} !== 'undefined'
  ? ${EXPRESSION_GLOBAL_NAME}.default ?? ${EXPRESSION_GLOBAL_NAME}
  : undefined;
if (plugin === undefined) {
  throw new Error(
    'yapmod: bundle has no default export; export the plugin with \`export default\`.',
  );
}
return plugin;
})();
`;
