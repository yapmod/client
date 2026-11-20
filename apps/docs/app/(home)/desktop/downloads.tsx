'use client';

import { ArrowUpRight, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DesktopRelease } from '@/lib/desktop';

const platforms = ['macOS', 'Windows', 'Linux'] as const;
type Platform = (typeof platforms)[number];

function detectPlatform(): Platform | null {
  const { userAgent, platform, maxTouchPoints } = navigator;
  if (/Android|Mobile|iPhone|iPad|iPod|CrOS/i.test(userAgent)) return null;
  // iPadOS can request desktop pages and identify itself as a Mac.
  if (/Mac/i.test(platform) && maxTouchPoints > 1) return null;
  if (/Mac/i.test(platform || userAgent)) return 'macOS';
  if (/Win/i.test(platform || userAgent)) return 'Windows';
  if (/Linux/i.test(platform || userAgent)) return 'Linux';
  return null;
}

export function Downloads({ release }: { release: DesktopRelease }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => {
    setPlatform((current) => current ?? detectPlatform());
  }, []);

  const options = {
    macOS: [
      { label: 'Download for macOS', detail: 'DMG · Apple Silicon and Intel', href: release.mac },
    ],
    Windows: [
      { label: 'Download for Windows', detail: 'EXE · Windows x64', href: release.windows },
    ],
    Linux: [
      { label: 'Download AppImage', detail: 'AppImage · Linux x64', href: release.appimage },
      { label: 'Download Debian package', detail: 'DEB · Linux x64', href: release.deb },
    ],
  };
  const installers = platform ? options[platform].filter((item) => item.href) : [];

  return (
    <>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Choose your platform</legend>
        <div className="inline-flex gap-1 rounded-xl border bg-card p-1">
          {platforms.map((name) => (
            <label key={name} className="cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name="platform"
                value={name}
                checked={platform === name}
                onChange={() => setPlatform(name)}
              />
              <span className="block rounded-lg px-4 py-2 text-sm text-muted-foreground peer-checked:bg-muted peer-checked:font-semibold peer-checked:text-foreground peer-focus-visible:outline-2">
                {name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite" className="mt-4 min-h-20">
        {platform &&
          (installers.length ? (
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              {installers.map(({ label, detail, href }, index) => (
                <div key={label}>
                  <a
                    className={`home-action ${index === 0 ? 'home-primary' : 'home-secondary'}`}
                    href={href}
                  >
                    <Download size={16} aria-hidden="true" />
                    {label}
                  </a>
                  <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <a className="home-link" href={release.source}>
              Check GitHub for {platform} installers <ArrowUpRight size={15} />
            </a>
          ))}
      </div>
      <noscript>
        <a className="home-link" href={release.source}>
          Choose an installer on GitHub
        </a>
      </noscript>
    </>
  );
}
