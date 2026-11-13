import { fileURLToPath } from 'node:url';

import {
  EXPRESSION_GLOBAL_NAME,
  expressionBanner,
  expressionFooter,
  yapmodPlugin,
} from '../src/index.ts';

/*
 * The bundler recipe documented in apps/docs/content/docs/plugins/creating.mdx,
 * kept as a working test: the unplugin compiles the sample, and the banner/
 * footer wrap vite's iife output in the expression the loader evaluates.
 */
const root = fileURLToPath(new URL('.', import.meta.url));

export default {
  root,
  plugins: [yapmodPlugin.vite()],
  build: {
    outDir: 'hello/dist',
    emptyOutDir: false,
    lib: {
      entry: 'hello/index.tsx',
      formats: ['iife'],
      name: EXPRESSION_GLOBAL_NAME,
      fileName: () => 'vite-plugin.js',
    },
    rollupOptions: {
      output: { banner: expressionBanner, footer: expressionFooter },
    },
  },
};
