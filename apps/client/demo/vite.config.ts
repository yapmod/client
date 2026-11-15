import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * Serves the component demo page.
 *
 * It is a separate Vite app so the demo never ends up in the distributable
 * client bundle.
 */
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [solid()],
  resolve: {
    dedupe: ['solid-js'],
  },
});
