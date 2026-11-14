import { notFound } from 'next/navigation';
import { blogAuthors, blogSource } from '@/lib/source';
import { getPosts, getTagPosts, getTags } from '@/lib/blog';
import { BlogCards, BlogHeader, BlogTitle } from '@/components/blog';

export default async function Page(props: { params: Promise<{ tag: string }> }) {
  const { tag } = await props.params;
  const result = getTagPosts(getPosts(blogSource.getPages(), blogAuthors), tag);
  if (!result) notFound();

  return (
    <div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-4 px-4 py-12">
      <BlogHeader>
        <BlogTitle>{result.tag.name}</BlogTitle>
      </BlogHeader>
      <BlogCards posts={result.posts} />
    </div>
  );
}

export function generateStaticParams() {
  return getTags(getPosts(blogSource.getPages())).map((tag) => ({ tag: tag.slug }));
}
