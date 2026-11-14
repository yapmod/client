import { blogAuthors, blogSource } from '@/lib/source';
import { getPosts } from '@/lib/blog';
import { BlogCards } from '@/components/blog';

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-(--fd-layout-width) px-4 py-12">
      <BlogCards posts={getPosts(blogSource.getPages(), blogAuthors)} />
    </div>
  );
}
