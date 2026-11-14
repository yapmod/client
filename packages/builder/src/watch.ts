import { context, formatMessagesSync, type Plugin } from 'esbuild';

import { createBuildOptions } from './build.ts';
import { expressionBanner, expressionFooter } from './expression.ts';

/*
 * Watch mode: the same esbuild pipeline as a production build, but kept
 * alive so every save produces a fresh expression.
 *
 * The expression is the unit the client evaluates, so the watch output is
 * exactly what `buildPlugin` would have written to disk — a dev session and
 * a release build cannot differ.
 */

export interface WatchPluginOptions {
  /** Plugin entry file (`.ts`, `.tsx`, `.js` or `.jsx`). */
  entry: string;
  /** Minify the bundle. */
  minify?: boolean;
  /** Called with the new expression after every successful rebuild. */
  onRebuild: (expression: string) => void;
  /** Called when a rebuild fails. The previous expression stays valid. */
  onError: (error: Error) => void;
}

/**
 * Starts watching the plugin entry and rebuilding it on every change.
 *
 * Returns a function that stops the watcher and releases the esbuild
 * context. The initial build is reported through `onRebuild` just like any
 * later one, so a dev server can publish it right away.
 */
export async function watchPlugin(options: WatchPluginOptions): Promise<() => Promise<void>> {
  const capture: Plugin = {
    name: 'yapmod:capture',
    setup(buildApi) {
      buildApi.onEnd((args) => {
        if (args.errors.length > 0) {
          options.onError(new Error(formatMessagesSync(args.errors, { kind: 'error' }).join('\n')));
          return;
        }

        const output = args.outputFiles?.[0];
        if (!output) {
          options.onError(new Error('@yapmod/builder: esbuild produced no output.'));
          return;
        }

        options.onRebuild(expressionBanner + output.text + expressionFooter);
      });
    },
  };

  const base = createBuildOptions({ entry: options.entry, minify: options.minify });
  const ctx = await context({ ...base, plugins: [...(base.plugins ?? []), capture] });
  await ctx.watch();

  return async () => {
    await ctx.dispose();
  };
}
