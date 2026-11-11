import { createFromSource } from 'fumadocs-core/search/server';
import type { APIRoute } from 'astro';
import { source } from '@/lib/source';

const server = createFromSource(source, {
  language: 'english',
});

export const GET: APIRoute = () => server.staticGET();
