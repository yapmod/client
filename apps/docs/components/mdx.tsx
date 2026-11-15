import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  ButtonPreview,
  DividerPreview,
  HintPreview,
  IconPreview,
  InputPreview,
  PanelPreview,
  SelectPreview,
  SectionPreview,
  SettingsExamplePreview,
  SettingRowPreview,
  SettingTextPreview,
  SettingsPagePreview,
  SwitchPreview,
  TextareaPreview,
} from '@/components/component-preview';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ButtonPreview,
    DividerPreview,
    HintPreview,
    IconPreview,
    InputPreview,
    PanelPreview,
    SelectPreview,
    SectionPreview,
    SettingsExamplePreview,
    SettingRowPreview,
    SettingTextPreview,
    SettingsPagePreview,
    SwitchPreview,
    TextareaPreview,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
