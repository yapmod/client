import type { YapmodPluginApi } from '@yapmod/types';

declare global {
  /**
   * The plugin API the host injects. Every `@yapmod/builder` bundle runs
   * inside `function (yapmod) { ... }`, so top-level plugin code can use it
   * without importing anything: `import type {} from '@yapmod/builder/global'`
   * pulls this declaration into a project.
   */
  const yapmod: YapmodPluginApi;
}
