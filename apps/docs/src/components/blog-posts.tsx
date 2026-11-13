import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Provider, type ProviderProps } from '@/components/provider';
import type { BlogPost } from '@/lib/blog';
import { BlogCards, BlogHeader, BlogTitle, BlogDescription } from '@/components/blog';

export function BlogPosts({ posts, ...props }: ProviderProps & { posts: BlogPost[] }) {
  return (
    <Provider {...props}>
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-8 px-4 py-12">
          <BlogHeader>
            <BlogTitle>Blog</BlogTitle>
            <BlogDescription>Updates, tips, and news about the Yapin client mod.</BlogDescription>
          </BlogHeader>
          <BlogCards posts={posts} />
        </div>
      </HomeLayout>
    </Provider>
  );
}
