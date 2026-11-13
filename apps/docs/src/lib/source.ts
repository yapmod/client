import { toFumadocsSource } from '@fumadocs/astro/source';
import { getCollection } from 'astro:content';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/plugins/lucide-icons';
import type { BlogAuthor } from './blog';

export const source = loader({
  source: toFumadocsSource(await getCollection('docs'), await getCollection('meta')),
  baseUrl: '/client/docs',
  plugins: [lucideIconsPlugin()],
});

export const blogSource = loader({
  baseUrl: '/client/blog',
  source: toFumadocsSource(await getCollection('blog')),
});

export const blogAuthors: Record<string, BlogAuthor> = {
  ilyeshdz: {
    name: 'Ilyes Hernandez',
    title: 'Creator',
    url: 'https://github.com/ilyeshdz',
    image: 'https://avatars.githubusercontent.com/u/208867993?v=4',
  },
};
