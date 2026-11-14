import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Yapmod';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const blogImageRoute = '/og/blog';

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: 'yapmod',
  repo: 'client',
  branch: 'main',
};

const getDocsImageUrl = createGetUrl(docsImageRoute);
const getBlogImageUrl = createGetUrl(blogImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.webp'];

  return { segments, url: getDocsImageUrl(segments, page.locale) };
}

export function getBlogImageUrlFn(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.webp'];

  return { segments, url: getBlogImageUrl(segments, page.locale) };
}
