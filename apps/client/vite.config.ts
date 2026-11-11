import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * Builds the final distributable: one self-contained classic-script bundle
 * (`dist/yapmod-client.js`) with SolidJS and all runtime dependencies inlined.
 */
export default defineConfig({
  plugins: [solid()],
  resolve: {
    // Guarantee a single SolidJS instance across workspace packages.
    dedupe: ['solid-js'],
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'YapmodClient',
      formats: ['iife'],
      fileName: () => 'yapmod-client.js',
    },
  },
});
