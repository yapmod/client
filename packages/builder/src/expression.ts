/*
 * The expression form the client's plugin loader evaluates (see
 * apps/client/src/features/plugins/eval.ts): a parenthesized function that
 * receives the plugin API and hands back the plugin module. The builder wraps
 * every bundle in exactly this shape, and bundler recipes reuse these
 * constants so their output loads unchanged.
 */

/** Name bundlers assign to the bundle; the footer reads the exports back. */
export const EXPRESSION_GLOBAL_NAME = 'yapmodPlugin';

/** Opens the expression: the loader calls it with the plugin API. */
export const expressionBanner = '(function (yapmod) {\n';

/**
 * Closes the expression and returns the default export. Bundlers expose
 * `export default` as `<globalName>.default`; a function default reaches the
 * loader unchanged and is called with the API, so factories work too.
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
});
`;
