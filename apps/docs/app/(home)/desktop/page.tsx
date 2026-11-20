import { ArrowUpRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { desktopReleases, getDesktopRelease } from '@/lib/desktop';
import { Downloads } from './downloads';
import '../home.css';

export const metadata: Metadata = {
  title: 'Download Yapmod Desktop',
  description: 'Download Yapmod Desktop for macOS, Windows, and Linux.',
};

export const revalidate = 300;

export default async function DesktopPage() {
  const release = await getDesktopRelease();
  return (
    <section aria-labelledby="desktop-title" className="desktop-page flex flex-1 items-center">
      <div className="home-wrap grid items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-24">
        <div>
          <Image src="/desktop/icon.png" alt="" width={68} height={68} />
          <h1
            id="desktop-title"
            className="font-heading mt-5 text-[clamp(3.25rem,6vw,5.25rem)] leading-none tracking-tight"
          >
            Yapmod Desktop
          </h1>
          <p className="mt-4 mb-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            Bring your Yapin themes and plugins to your desktop, with native notifications and the
            option to launch at login.
          </p>
          {release ? (
            <>
              <Downloads release={release} />
              <a className="home-link mt-4 text-muted-foreground" href={release.notes}>
                {release.version} release notes <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <p className="mb-3 text-muted-foreground">
                The installer list is temporarily unavailable.
              </p>
              <a className="home-action home-primary" href={desktopReleases}>
                <Download size={16} aria-hidden="true" /> Download from GitHub
              </a>
            </>
          )}
        </div>
        <div className="desktop-preview">
          <Image
            src="/desktop/settings.webp"
            alt="Yapmod Desktop settings with controls for notifications, launch at login, and software updates."
            width={1700}
            height={1130}
            sizes="(min-width: 1024px) 550px, (max-width: 768px) 90vw, 720px"
            className="w-full rounded-lg shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
