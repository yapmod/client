import { ArrowRight, Download, Smartphone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestRelease, notesPath, releasesUrl } from '@/lib/releases';
import '../home.css';

export const metadata: Metadata = {
  title: 'Download Yapmod Mobile',
  description: 'Install Yapmod Mobile on Android or iPhone and sign in to Yapin.',
};

const platforms = [
  {
    name: 'Android',
    suffix: '.apk',
    steps: [
      'On Android 7 or later, download the APK and open it from Files or your browser’s downloads.',
      'If prompted, allow installation from the app that opened the file. Tap Install, then Open. You can turn that permission off afterward.',
      'To update, open the newer signed APK and choose Update instead of uninstalling.',
    ],
  },
  {
    name: 'iPhone',
    suffix: '.ipa',
    steps: [
      'On iOS 16.4 or later, use a Mac or Windows PC with AltServer to install AltStore Classic on your iPhone. Follow the linked setup guide for trust and Developer Mode prompts.',
      'Save the IPA to Files. With AltServer reachable, open AltStore Classic → My Apps → + and select the IPA to sign and install it.',
      'With a free Apple Account, refresh in My Apps before the seven-day signing period expires. To update, import the newer IPA with the same account.',
    ],
  },
] as const;

export default async function MobilePage() {
  const release = await getLatestRelease('mobile');
  const guide = `https://github.com/yapmod/mobile/blob/${encodeURIComponent(release?.version ?? 'main')}/docs/install.md`;
  return (
    <section className="desktop-page flex-1">
      <div className="home-wrap py-12 lg:py-20">
        <Smartphone className="feature-icon" size={44} aria-hidden="true" />
        <h1 className="font-heading mt-5 text-[clamp(3.25rem,6vw,5.25rem)] leading-none tracking-tight">
          Yapmod Mobile
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          The app includes the Yapmod client and Mobile plugin. Choose the installer for your phone,
          then sign in to Yapin.
        </p>
        <Link
          href={release ? notesPath('mobile', release.version) : '/releases#mobile'}
          className="home-link mt-4"
        >
          {release?.version} Mobile release notes <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {platforms.map(({ name, suffix, steps }) => {
            const asset = release?.assets.find(
              (item) => item.name === `Yapmod-Mobile-${release.version}${suffix}`,
            );
            return (
              <section key={name} className="download-card flex flex-col items-start">
                <h2 className="font-heading text-3xl">{name}</h2>
                <ol className="install-steps my-5 flex-1 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {asset ? (
                  <a
                    className={`home-action ${suffix === '.apk' ? 'home-primary' : 'home-secondary'}`}
                    href={asset.browser_download_url}
                  >
                    <Download size={16} aria-hidden="true" />
                    Download for {name}
                  </a>
                ) : (
                  <a className="home-link" href={release?.source ?? releasesUrl('mobile')}>
                    Find the {suffix} on GitHub Releases
                  </a>
                )}
              </section>
            );
          })}
        </div>
        <a className="home-link mt-6" href={guide}>
          Full installation guide, AltStore setup and checksum verification{' '}
          <ArrowRight size={15} aria-hidden="true" />
        </a>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          After signing in, open <strong>Settings → Yapmod → Mobile</strong> to reload Yapin or turn
          modifications off. Touch the Yapin view with three fingers to open native settings even
          before sign-in. With permission, the app delivers alerts while Yapin is running; it does
          not receive background push notifications.
        </p>
      </div>
    </section>
  );
}
