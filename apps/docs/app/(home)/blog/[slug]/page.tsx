import { notFound } from 'next/navigation';
import { blogAuthors, blogSource } from '@/lib/source';
import { findPost, getPosts } from '@/lib/blog';
import { getMDXComponents } from '@/components/mdx';
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

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const page = blogSource.getPage([slug]);
  const found = page && findPost(getPosts(blogSource.getPages(), blogAuthors), page.url);
  if (!page || !found) notFound();

  const { post, newer, older } = found;
  const MDX = page.data.body;

  return (
    <BlogPage toc={page.data.toc}>
      <BlogHeader>
        <BlogBackLink href="/blog" />
        <BlogTitle>{post.title}</BlogTitle>
        <BlogDescription>{post.description}</BlogDescription>
        <BlogAuthors authors={post.authors} />
        <BlogTags tags={post.tags} />
        {post.date && <BlogDate date={post.date} />}
      </BlogHeader>
      <BlogBody>
        <MDX components={getMDXComponents()} />
      </BlogBody>
      <BlogPostNav newer={newer} older={older} />
    </BlogPage>
  );
}
