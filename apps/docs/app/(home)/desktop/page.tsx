import { ArrowRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getDesktopRelease } from '@/lib/desktop';
import { notesPath, releasesUrl } from '@/lib/releases';
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
            <Downloads release={release} />
          ) : (
            <>
              <p className="mb-3 text-muted-foreground">
                The installer list is temporarily unavailable.
              </p>
              <a className="home-action home-primary" href={releasesUrl('desktop') + '/latest'}>
                <Download size={16} aria-hidden="true" /> Download from GitHub
              </a>
            </>
          )}
          <div>
            <Link
              className="home-link mt-4"
              href={release ? notesPath('desktop', release.version) : '/releases#desktop'}
            >
              {release ? `${release.version} release notes` : 'Desktop release notes'}{' '}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="desktop-preview">
          <a
            href="/desktop/macos-settings.webp"
            aria-label="View the full-size macOS settings screenshot"
            className="block rounded-lg cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <Image
              src="/desktop/macos-settings.webp"
              alt="Yapmod Desktop settings with controls for notifications, launch at login, and software updates."
              width={1196}
              height={896}
              sizes="(min-width: 1024px) 550px, (max-width: 768px) 90vw, 720px"
              className="w-full rounded-lg shadow-xl"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
