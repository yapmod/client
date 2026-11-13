import type { TOCItemType } from 'fumadocs-core/toc';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Provider, type ProviderProps } from '@/components/provider';
import type { BlogPost } from '@/lib/blog';
import {
  BlogAuthors,
  BlogBackLink,
  BlogBody,
  BlogDate,
  BlogDescription,
  BlogHeader,
  BlogPage,
  BlogPostNav,
  BlogTags,
  BlogTitle,
} from '@/components/blog';

export interface BlogPostPageProps extends ProviderProps {
  post: BlogPost;
  newer?: BlogPost;
  older?: BlogPost;
  toc: TOCItemType[];
}

/** the content is passed as children */
export function BlogPostPage({ post, newer, older, toc, children, ...props }: BlogPostPageProps) {
  return (
    <Provider {...props}>
      <HomeLayout {...baseOptions()}>
        <BlogPage toc={toc}>
          <BlogHeader>
            <BlogBackLink href="/client/blog" />
            <BlogTitle>{post.title}</BlogTitle>
            <BlogDescription>{post.description}</BlogDescription>
            <BlogAuthors authors={post.authors} />
            <BlogTags tags={post.tags} />
            {post.date && <BlogDate date={post.date} />}
          </BlogHeader>
          <BlogBody>{children}</BlogBody>
          <BlogPostNav newer={newer} older={older} />
        </BlogPage>
      </HomeLayout>
    </Provider>
  );
}
