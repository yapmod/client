import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Provider, type ProviderProps } from '@/components/provider';
import type { BlogTag } from '@/lib/blog';
import { BlogHeader, BlogTagCards, BlogTitle } from '@/components/blog';

export function BlogTagsPage({
  tags,
  ...props
}: ProviderProps & { tags: (BlogTag & { count: number })[] }) {
  return (
    <Provider {...props}>
      <HomeLayout {...baseOptions()}>
        <div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-4 px-4 py-12">
          <BlogHeader>
            <BlogTitle>All Tags</BlogTitle>
          </BlogHeader>
          <BlogTagCards tags={tags} />
        </div>
      </HomeLayout>
    </Provider>
  );
}
