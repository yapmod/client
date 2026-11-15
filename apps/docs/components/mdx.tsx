import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  ButtonPreview,
  HintPreview,
  IconPreview,
  InputPreview,
  PanelPreview,
  SelectPreview,
  SwitchPreview,
  TextareaPreview,
} from '@/components/component-preview';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ButtonPreview,
    HintPreview,
    IconPreview,
    InputPreview,
    PanelPreview,
    SelectPreview,
    SwitchPreview,
    TextareaPreview,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
