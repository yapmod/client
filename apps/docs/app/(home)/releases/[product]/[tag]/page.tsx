import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatReleaseDate, getReleaseByTag, products, releasesUrl } from '@/lib/releases';
import '../../../home.css';

type Props = PageProps<'/releases/[product]/[tag]'>;

async function readParams(params: Props['params']) {
  const { product, tag } = await params;
  if (
    (product !== 'client' && product !== 'desktop' && product !== 'extension') ||
    !/^[\w-][\w.+-]{0,127}$/.test(tag)
  ) {
    notFound();
  }
  return { product, tag } as const;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product, tag } = await readParams(params);
  return { title: `${products[product].name} ${tag} release notes` };
}

export default async function ReleasePage({ params }: Props) {
  const { product, tag } = await readParams(params);
  const result = await getReleaseByTag(product, tag);
  if (result.status === 'missing') notFound();

  const name = products[product].name;
  const github = `${releasesUrl(product)}/tag/${encodeURIComponent(tag)}`;
  const repoRoot = `https://github.com/${products[product].repository}/blob/${encodeURIComponent(tag)}/`;

  return (
    <article className="home-wrap release-article flex-1 py-10 md:py-16">
      <Link href={`/releases#${product}`} className="home-link">
        <ArrowLeft size={15} aria-hidden="true" /> All release notes
      </Link>
      <header className="mt-8 border-b pb-6">
        <p className="mb-2 font-medium text-muted-foreground">{name}</p>
        <h1 className="font-heading text-5xl tracking-tight">{tag}</h1>
        {result.status === 'ok' && (
          <time
            className="mt-3 block text-sm text-muted-foreground"
            dateTime={result.release.published_at}
          >
            {formatReleaseDate(result.release.published_at)}
          </time>
        )}
      </header>
      {result.status === 'ok' ? (
        result.release.body?.trim() ? (
          <div className="prose my-8 min-w-0 break-words">
            <Markdown
              skipHtml
              remarkPlugins={[remarkGfm]}
              urlTransform={(url) => {
                const safe = defaultUrlTransform(url);
                if (!safe || safe.startsWith('#')) return safe;
                return URL.canParse(safe, repoRoot) ? new URL(safe, repoRoot).href : '';
              }}
            >
              {result.release.body}
            </Markdown>
          </div>
        ) : (
          <p className="my-8">This release has no published notes.</p>
        )
      ) : (
        <p className="my-8">
          Release notes are temporarily unavailable. You can read the original release on GitHub
          below.
        </p>
      )}
      <footer className="flex flex-wrap gap-x-6 gap-y-3 border-t pt-5">
        <Link className="home-link" href={product === 'client' ? '/docs' : `/${product}`}>
          {product === 'client' ? 'Getting started' : `Download ${name}`}{' '}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <a href={github} className="home-link text-muted-foreground">
          View on GitHub <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </footer>
    </article>
  );
}
