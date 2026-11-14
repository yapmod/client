import { blogSource } from '@/lib/source';
import { notFound } from 'next/navigation';
import { generateOgImage } from '@/lib/og';
import { getBlogImageUrlFn } from '@/lib/shared';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/blog/[...slug]'>) {
  const { slug } = await params;
  const page = blogSource.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return await generateOgImage({
    title: page.data.title,
    description: page.data.description,
    site: 'Yapmod Blog',
  });
}

export function generateStaticParams() {
  return blogSource.getPages().map((page) => ({
    lang: page.locale,
    slug: getBlogImageUrlFn(page).segments,
  }));
}
