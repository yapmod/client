import fumadocs from '@fumadocs/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// The docs app is fully independent from the client runtime: React is used
// only by Fumadocs islands inside this app and never enters the client bundle.

export default defineConfig({
  integrations: [
    fumadocs({
      components: './src/components/mdx.tsx',
      collections: {
        docs: { dir: 'content/docs' },
        blog: { dir: 'content/blog' },
      },
      rehypeCodeOptions: {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
