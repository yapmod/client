import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Provider, type ProviderProps } from '@/components/provider';
import type { BlogPost, BlogTag } from '@/lib/blog';
import { BlogCards, BlogHeader, BlogTitle } from '@/components/blog';

export function BlogTagPage({
  tag,
  posts,
  ...props
}: ProviderProps & { tag: BlogTag; posts: BlogPost[] }) {
  return (
    <Provider {...props}>
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-4 px-4 py-12">
          <BlogHeader>
            <BlogTitle>{tag.name}</BlogTitle>
          </BlogHeader>
          <BlogCards posts={posts} />
        </div>
      </HomeLayout>
    </Provider>
  );
}
