import { ArrowRight, ChevronLeft, ChevronRight, Monitor, Puzzle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  formatReleaseDate,
  getReleaseHistory,
  notesPath,
  products,
  releasesUrl,
  type Product,
} from '@/lib/releases';
import '../home.css';

export const metadata: Metadata = {
  title: 'Yapmod release notes',
  description: 'Read the release history for Yapmod Desktop and Yapmod Extension.',
};

function pageNumber(value: string | string[] | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export default async function ReleasesPage({ searchParams }: PageProps<'/releases'>) {
  const query = await searchParams;
  const pages = { desktop: pageNumber(query.desktop), extension: pageNumber(query.extension) };
  const [desktop, extension] = await Promise.all([
    getReleaseHistory('desktop', pages.desktop),
    getReleaseHistory('extension', pages.extension),
  ]);
  const histories = { desktop, extension };
  function pageLink(product: Product, page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...pages, [product]: page })) {
      if (value > 1) params.set(key, String(value));
    }
    return `/releases${params.size ? `?${params}` : ''}#${product}`;
  }

  return (
    <section className="home-wrap flex-1 py-12 lg:py-20">
      <h1 className="font-heading text-[clamp(3rem,6vw,5rem)] leading-none tracking-tight">
        Release notes
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        What changed in each release of Yapmod Desktop and Yapmod Extension.
      </p>
      <div className="mt-10 grid items-start gap-8 md:grid-cols-2">
        {(['desktop', 'extension'] as const).map((product) => {
          const history = histories[product];
          const Icon = product === 'desktop' ? Monitor : Puzzle;
          return (
            <section key={product} id={product} className="download-card scroll-mt-20">
              <Icon className="feature-icon mb-3" size={23} aria-hidden="true" />
              <h2 className="font-heading text-3xl">{products[product].name}</h2>
              {history ? (
                <ul className="mt-4">
                  {history.releases.map((release) => (
                    <li key={release.tag_name} className="border-t">
                      <Link href={notesPath(product, release.tag_name)} className="release-row">
                        <span className="font-semibold">{release.tag_name}</span>
                        <time
                          className="text-sm text-muted-foreground"
                          dateTime={release.published_at}
                        >
                          {formatReleaseDate(release.published_at)}
                        </time>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4">
                  Release history is temporarily unavailable.{' '}
                  <a className="underline" href={releasesUrl(product)}>
                    Read it on GitHub
                  </a>
                  .
                </p>
              )}
              {history?.releases.length === 0 && (
                <p className="text-muted-foreground">No stable releases on this page.</p>
              )}
              {(pages[product] > 1 || history?.hasNext) && (
                <nav
                  aria-label={`${products[product].name} release history`}
                  className="mt-4 flex gap-4"
                >
                  {pages[product] > 1 && (
                    <Link className="home-link" href={pageLink(product, pages[product] - 1)}>
                      <ChevronLeft size={15} /> Newer releases
                    </Link>
                  )}
                  {history?.hasNext && (
                    <Link className="home-link" href={pageLink(product, pages[product] + 1)}>
                      Older releases <ChevronRight size={15} />
                    </Link>
                  )}
                </nav>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
