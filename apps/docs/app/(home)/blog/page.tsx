import { blogAuthors, blogSource } from '@/lib/source';
import { getPosts } from '@/lib/blog';
import { BlogCards } from '@/components/blog';

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-(--fd-layout-width) px-4 py-12">
      <h1 className="mb-8 font-heading text-5xl tracking-tight">Yapmod blog</h1>
      <BlogCards posts={getPosts(blogSource.getPages(), blogAuthors)} />
    </div>
  );
}
