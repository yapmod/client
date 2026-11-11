import fumadocs from '@fumadocs/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// The docs app is fully independent from the client runtime: React is used
// only by Fumadocs islands inside this app and never enters the client bundle.
export default defineConfig({
  integrations: [fumadocs({ components: './src/components/mdx.tsx' })],
  vite: {
    plugins: [tailwindcss()],
  },
});
