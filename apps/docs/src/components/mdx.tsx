import type { MDXComponents } from 'mdx/types';
import { DocsBody } from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...components,
  } satisfies MDXComponents;
}

// For the Fumadocs integration, `wrapper` gives the content its prose styles.
export default getMDXComponents({ wrapper: DocsBody });
