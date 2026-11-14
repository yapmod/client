import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  clean: true,
  target: 'es2020',
  external: [
    '@babel/core',
    '@babel/preset-typescript',
    'babel-preset-solid',
    'esbuild',
    'solid-js',
    'unplugin',
  ],
});
