import { createUnplugin } from 'unplugin';

import { transformPluginSource } from './transform.ts';

/*
 * Bundler integration (vite, rollup, webpack, rspack): compiles plugin
 * TSX and rewrites shared-module imports before the host bundler sees the
 * source. The result is module code with no `solid-js` imports left, so the
 * bundler never resolves Solid; wrap its output with `expressionBanner` and
 * `expressionFooter` (and the `EXPRESSION_GLOBAL_NAME` global) so the
 * client's loader can evaluate it. Build-time only — dev servers execute
 * modules outside the loader's `yapmod` wrapper.
 */
export const yapmodPlugin = createUnplugin(() => ({
  name: 'yapmod-plugin',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('node_modules')) return null;
    if (!/\.(?:[cm]?[jt]sx?)$/.test(id)) return null;
    const transformed = transformPluginSource(code, id);
    return transformed === null ? null : { code: transformed, map: null };
  },
}));
