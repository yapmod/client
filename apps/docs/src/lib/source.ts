import { toFumadocsSource } from '@fumadocs/astro/source';
import { getCollection } from 'astro:content';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  source: toFumadocsSource(await getCollection('docs'), await getCollection('meta')),
  baseUrl: '/docs',
});
