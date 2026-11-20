import { getLatestRelease } from './releases';

export async function getDesktopRelease() {
  const release = await getLatestRelease('desktop');
  if (!release) return null;
  const installer = (suffix: string) =>
    release.assets.find((asset) => asset.name.endsWith(suffix))?.browser_download_url;
  return {
    version: release.version,
    source: release.source,
    mac: installer('-universal.dmg'),
    windows: installer('_x64-setup.exe'),
    appimage: installer('_amd64.AppImage'),
    deb: installer('_amd64.deb'),
  };
}

export type DesktopRelease = NonNullable<Awaited<ReturnType<typeof getDesktopRelease>>>;
