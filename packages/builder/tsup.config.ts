import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/transform.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  clean: true,
  target: 'es2020',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    '@babel/core',
    '@babel/preset-typescript',
    'babel-preset-solid',
    'commander',
    'esbuild',
    'solid-js',
  ],
});
