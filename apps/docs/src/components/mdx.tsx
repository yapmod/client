import type { MDXComponents } from 'mdx/types';
import { DocsBody } from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as Twoslash from 'fumadocs-twoslash/ui';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...Twoslash,
    ...components,
  } satisfies MDXComponents;
}

// For the Fumadocs integration, `wrapper` gives the content its prose styles.
export default getMDXComponents({ wrapper: DocsBody });
