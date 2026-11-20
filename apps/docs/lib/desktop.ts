import { z } from 'zod';

const releasesUrl = 'https://github.com/yapmod/desktop/releases';
export const desktopReleases = `${releasesUrl}/latest`;

const schema = z.object({
  tag_name: z.string().min(1),
  assets: z.array(
    z.object({ name: z.string(), browser_download_url: z.string(), state: z.string() }),
  ),
});

export async function getDesktopRelease() {
  try {
    const response = await fetch('https://api.github.com/repos/yapmod/desktop/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const release = schema.parse(await response.json());
    const tag = encodeURIComponent(release.tag_name);
    const assets = release.assets.filter(
      (asset) =>
        asset.state === 'uploaded' &&
        asset.browser_download_url.startsWith(`${releasesUrl}/download/${tag}/`),
    );
    const installer = (suffix: string) =>
      assets.find((asset) => asset.name.endsWith(suffix))?.browser_download_url;
    return {
      version: release.tag_name,
      notes: `${releasesUrl}/tag/${tag}`,
      mac: installer('-universal.dmg'),
      windows: installer('_x64-setup.exe'),
      appimage: installer('_amd64.AppImage'),
      deb: installer('_amd64.deb'),
    };
  } catch (error) {
    console.warn(
      '[yapmod] Could not load desktop downloads.',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export type DesktopRelease = NonNullable<Awaited<ReturnType<typeof getDesktopRelease>>>;
