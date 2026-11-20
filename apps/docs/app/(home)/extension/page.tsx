import { ArrowRight, Download, Globe, Puzzle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestRelease, notesPath, releasesUrl } from '@/lib/releases';
import '../home.css';

export const metadata: Metadata = {
  title: 'Download Yapmod Extension',
  description: 'Install Yapmod in Chrome or Firefox to use themes and plugins on Yapin.',
};
export const revalidate = 300;

const browsers = [
  {
    name: 'Chrome',
    file: 'chrome.zip',
    steps: [
      <>Extract the downloaded ZIP.</>,
      <>
        Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>.
      </>,
      <>
        Click <strong>Load unpacked</strong> and select the extracted folder containing{' '}
        <code>manifest.json</code>.
      </>,
    ],
  },
  {
    name: 'Firefox',
    file: 'firefox.zip',
    steps: [
      <>
        Open <code>about:debugging</code> and select <strong>This Firefox</strong>.
      </>,
      <>
        Click <strong>Load Temporary Add-on</strong> and select the downloaded ZIP.
      </>,
      <>Load the ZIP again after each Firefox restart.</>,
    ],
  },
] as const;

export default async function ExtensionPage() {
  const release = await getLatestRelease('extension');
  return (
    <section className="desktop-page flex-1">
      <div className="home-wrap py-12 lg:py-20">
        <Puzzle className="feature-icon" size={44} aria-hidden="true" />
        <h1 className="font-heading mt-5 text-[clamp(3.25rem,6vw,5.25rem)] leading-none tracking-tight">
          Yapmod Extension
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Use Yapmod themes and plugins in your existing Yapin browser session. Install the
          extension, then reload Yapin.
        </p>
        <Link
          href={release ? notesPath('extension', release.version) : '/releases#extension'}
          className="home-link mt-4"
        >
          {release ? `${release.version} release notes` : 'Extension release notes'}{' '}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {browsers.map(({ name, file, steps }, i) => {
            const asset = release?.assets.find((item) => item.name === file);
            return (
              <section key={name} className="download-card flex flex-col items-start">
                <h2 className="font-heading text-3xl">{name}</h2>
                <ol className="install-steps my-5 flex-1 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                {asset ? (
                  <a
                    className={`home-action ${i === 0 ? 'home-primary' : 'home-secondary'}`}
                    href={asset.browser_download_url}
                  >
                    <Download size={16} aria-hidden="true" /> Download for {name}
                  </a>
                ) : (
                  <p className="text-sm">
                    The {name} package is unavailable.{' '}
                    <a className="underline" href={release?.source ?? releasesUrl('extension')}>
                      Check GitHub Releases
                    </a>
                    .
                  </p>
                )}
              </section>
            );
          })}
        </div>
        <Link href="/docs/get-started" className="home-link mt-6">
          <Globe size={15} aria-hidden="true" /> Set up Yapmod manually{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
