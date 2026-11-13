import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { build, type Plugin } from 'esbuild';

import { EXPRESSION_GLOBAL_NAME, expressionBanner, expressionFooter } from './expression.ts';
import { transformPluginSource } from './transform.ts';

/*
 * esbuild passes: first-party sources go through Babel, and any dependency
 * that still imports `solid-js` is a hard error — bundling it would put a
 * second Solid on the page and split signal state away from the host's.
 */
const babelTransform: Plugin = {
  name: 'yapmod:babel-transform',
  setup(buildApi) {
    buildApi.onLoad({ filter: /\.(?:[cm]?[jt]sx?)$/ }, (args) => {
      if (args.path.includes('node_modules')) return undefined;
      const source = readFileSync(args.path, 'utf8');
      const code = transformPluginSource(source, args.path);
      return code === null ? undefined : { contents: code, loader: 'js' as const };
    });
  },
};

const sharedModuleGuard: Plugin = {
  name: 'yapmod:shared-module-guard',
  setup(buildApi) {
    buildApi.onResolve({ filter: /^solid-js(?:\/.*)?$/ }, (args) => ({
      errors: [
        {
          text:
            `Dependency "${args.path}" imports solid-js, but the page already runs ` +
            'the shared instance (yapmod.solid*). Plugin dependencies must not ' +
            'bundle their own copy of Solid.',
        },
      ],
    }));
  },
};

export interface BuildPluginOptions {
  /** Plugin entry file (`.ts`, `.tsx`, `.js` or `.jsx`). */
  entry: string;
  /** Where the loadable expression is written. */
  outfile: string;
  /** Minify the bundle. */
  minify?: boolean;
}

/**
 * Bundles a plugin entry into a self-contained expression the client's
 * loader can evaluate: Babel compiles TSX and rewrites shared-module
 * imports, esbuild bundles everything else, and the result is wrapped in
 * the `function (yapmod) { ... }` shape from `expression.ts`.
 *
 * Returns the expression and writes it to `options.outfile`.
 */
export async function buildPlugin(options: BuildPluginOptions): Promise<string> {
  const result = await build({
    entryPoints: [options.entry],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: EXPRESSION_GLOBAL_NAME,
    // The Babel pass already compiled JSX away; keep esbuild from guessing.
    jsx: 'preserve',
    target: 'es2020',
    minify: options.minify ?? false,
    plugins: [babelTransform, sharedModuleGuard],
  });

  const output = result.outputFiles[0];
  if (!output) throw new Error('@yapmod/builder: esbuild produced no output.');

  const expression = expressionBanner + output.text + expressionFooter;
  await mkdir(dirname(options.outfile), { recursive: true });
  await writeFile(options.outfile, expression, 'utf8');
  return expression;
}
