import { defineCollection } from 'astro:content';
import { metaLoader, pageLoader } from '@fumadocs/astro/loaders';
import { blogPageSchema } from '@/lib/blog';

export const collections = {
  docs: defineCollection({ loader: pageLoader() }),
  meta: defineCollection({ loader: metaLoader() }),
  blog: defineCollection({ loader: pageLoader('blog'), schema: blogPageSchema }),
};
