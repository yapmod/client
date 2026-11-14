/*
 * Self-contained type declaration for the `yapmod` global.
 *
 * Inlined from `@yapmod/types` so the builder package has no runtime
 * dependency on the monorepo types package (which itself depends on
 * `@yapmod/ui` and `solid-js`).  Plugin authors only need these shapes
 * for type-checking; the real API object is provided at runtime by the
 * Yapmod client on the host page.
 *
 * Usage: `import type {} from '@yapmod/builder/global'` loads this
 * ambient declaration into a project.
 */

import type { Component, JSX } from 'solid-js';

interface YapmodPluginApi {
  readonly apiVersion: 1;
  readonly id: string;
  readonly manifest: {
    name: string;
    author: string;
    description: string;
    version?: string;
    hash?: string;
  };
  readonly storage: Record<string, unknown>;
  flushStorage(): void;
  log(...args: unknown[]): void;
  observe(selector: string, onFound: (element: Element) => void): () => void;
  readonly ui: {
    showToast(message: string, kind?: 'success' | 'error'): void;
    openModal(options: {
      title: string;
      description?: string;
      wide?: boolean;
      content: (close: () => void) => JSX.Element;
      footer?: (close: () => void) => JSX.Element;
      onClose?: () => void;
    }): () => void;
    injectCss(css: string): () => void;
    Button: Component<JSX.IntrinsicElements['button'] & { variant?: string }>;
    Hint: Component<JSX.IntrinsicElements['span']>;
    Panel: Component<JSX.IntrinsicElements['div']>;
    Icon: Component<{ name: string; class?: string; size?: string }>;
  };
  readonly settings: {
    registerSection(section: {
      id: string;
      label: string;
      icon?: string;
      render: () => JSX.Element;
    }): () => void;
  };
  onDispose(dispose: () => void): void;
  showSettings(): void;
  readonly solid: typeof import('solid-js');
  readonly solidWeb: typeof import('solid-js/web');
  readonly solidStore: typeof import('solid-js/store');
}

declare global {
  /**
   * The plugin API the host injects. Every `@yapmod/builder` bundle runs
   * inside `function (yapmod) { ... }`, so top-level plugin code can use it
   * without importing anything.
   */
  const yapmod: YapmodPluginApi;
}

// Export the interface so this file is treated as a module (allows empty
// type imports: `import type {} from '@yapmod/builder/global'`).
export type { YapmodPluginApi };
