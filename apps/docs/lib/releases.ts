import { z } from 'zod';

export const products = {
  client: { name: 'Yapmod Client & SDK', repository: 'yapmod/client' },
  desktop: { name: 'Yapmod Desktop', repository: 'yapmod/desktop' },
  extension: { name: 'Yapmod Extension', repository: 'yapmod/web' },
} as const;
export type Product = keyof typeof products;

const releaseSchema = z.object({
  tag_name: z.string().min(1),
  name: z.string().nullable(),
  body: z.string().nullable(),
  published_at: z.iso.datetime(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  assets: z.array(
    z.object({ name: z.string(), browser_download_url: z.string(), state: z.string() }),
  ),
});

type GitHubRelease = z.infer<typeof releaseSchema>;

export function releasesUrl(product: Product) {
  return `https://github.com/${products[product].repository}/releases`;
}

export function notesPath(product: Product, tag: string) {
  return `/releases/${product}/${encodeURIComponent(tag)}`;
}

function isStable(release: GitHubRelease) {
  return !release.draft && !release.prerelease;
}

function fetchReleases(product: Product, path: string) {
  return fetch(`https://api.github.com/repos/${products[product].repository}/releases${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(6000),
  });
}

async function readResponse(response: Response) {
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json() as Promise<unknown>;
}

function logError(product: Product, error: unknown) {
  console.warn(
    `[yapmod] Could not load ${product} releases.`,
    error instanceof Error ? error.message : error,
  );
}

export async function getLatestRelease(product: Product) {
  try {
    const release = releaseSchema.parse(
      await readResponse(await fetchReleases(product, '/latest')),
    );
    if (!isStable(release)) return null;

    const source = releasesUrl(product);
    const tag = encodeURIComponent(release.tag_name);
    const assets = release.assets.filter(
      (asset) =>
        asset.state === 'uploaded' &&
        asset.browser_download_url.startsWith(`${source}/download/${tag}/`),
    );
    return { version: release.tag_name, source: `${source}/tag/${tag}`, assets };
  } catch (error) {
    logError(product, error);
    return null;
  }
}

export async function getReleaseHistory(product: Product, page: number) {
  try {
    const response = await fetchReleases(product, `?per_page=10&page=${page}`);
    const releases = releaseSchema.array().parse(await readResponse(response));
    return {
      releases: releases.filter(isStable),
      hasNext: response.headers.get('link')?.includes('rel="next"') ?? false,
    };
  } catch (error) {
    logError(product, error);
    return null;
  }
}

export async function getReleaseByTag(product: Product, tag: string) {
  try {
    const response = await fetchReleases(product, `/tags/${encodeURIComponent(tag)}`);
    if (response.status === 404) return { status: 'missing' } as const;
    const release = releaseSchema.parse(await readResponse(response));
    if (!isStable(release)) return { status: 'missing' } as const;
    return { status: 'ok', release } as const;
  } catch (error) {
    logError(product, error);
    return { status: 'unavailable' } as const;
  }
}

export function formatReleaseDate(published: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(published),
  );
}
