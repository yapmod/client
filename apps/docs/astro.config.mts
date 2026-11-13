import fumadocs from '@fumadocs/astro';
import { transformerTwoslash } from 'fumadocs-twoslash';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// The docs app is fully independent from the client runtime: React is used
// only by Fumadocs islands inside this app and never enters the client bundle.
export default defineConfig({
  integrations: [
    fumadocs({
      components: './src/components/mdx.tsx',
      // Configure code blocks with light/dark themes and Twoslash for interactive
      // TypeScript type annotations.  The default Fumadocs transformers (notation
      // highlighting, etc.) are kept; Twoslash is appended so it runs after them.
      rehypeCodeOptions: {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        transformers: [
          transformerTwoslash({
            // Don't crash the build on Twoslash errors (e.g., unresolved imports);
            // fall back to plain highlighting instead.
            throws: false,
            onTwoslashError(error, code) {
              console.error('[yapmod-docs] twoslash error:', error, code.slice(0, 80));
            },
          }),
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
