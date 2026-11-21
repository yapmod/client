/**
 * Global declaration for the `yapmod` free variable and the `@yapmod/ui`
 * module.
 *
 * The @yapmod/builder injects the `yapmod` variable at compile time so
 * plugin code can reference it without importing anything, and rewrites
 * `@yapmod/ui` imports onto `yapmod.ui`. Add this package to your tsconfig
 * `types` array so both are typed automatically:
 *
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@yapmod/types/plugin-env"]
 *   }
 * }
 * ```
 *
 * @module
 */
declare const yapmod: import('../plugin').YapmodPluginApi;

/**
 * Type declaration for the `@yapmod/ui` module.
 *
 * The implementation ships with the client bundle and is exposed to plugins
 * as `yapmod.ui`; the builder rewrites these imports to that object. This
 * declaration keeps the import type-checking with only `@yapmod/types`
 * installed.
 *
 * Inline `import()` types are used instead of import declarations because an
 * ambient module declaration may not reference modules through relative
 * names with a top-level `import`.
 */
declare module '@yapmod/ui' {
  export type ButtonProps = import('../ui').ButtonProps;
  export type DividerProps = import('../ui').DividerProps;
  export type HintProps = import('../ui').HintProps;
  export type IconName = import('../ui').IconName;
  export type IconSource = import('../ui').IconSource;
  export type IconDefinition = import('../ui').IconDefinition;
  export type RegisteredIcon = import('../ui').RegisteredIcon;
  export type IconProps = import('../ui').IconProps;
  export type InputProps = import('../ui').InputProps;
  export type PanelProps = import('../ui').PanelProps;
  export type SectionSpacing = import('../ui').SectionSpacing;
  export type SectionProps = import('../ui').SectionProps;
  export type SelectOption = import('../ui').SelectOption;
  export type SelectProps = import('../ui').SelectProps;
  export type SettingRowProps = import('../ui').SettingRowProps;
  export type SettingTextProps = import('../ui').SettingTextProps;
  export type SettingsPageProps = import('../ui').SettingsPageProps;
  export type SwitchProps = import('../ui').SwitchProps;
  export type TextareaProps = import('../ui').TextareaProps;

  /** Options accepted by {@link createIcon}. */
  export interface CreateIconOptions {
    /** Width and height in pixels. Defaults to 16. */
    size?: number;
    /** Extra class on the `<svg>` element. */
    class?: string;
  }

  export type IconPath = import('../ui').IconPath;

  /** The bundled component stylesheet, as shipped in the JavaScript bundle. */
  export const uiCss: string;
  /** Adds a `<style>` element with the given id, unless one is already there. */
  export function injectStyle(id: string, css: string): void;
  /** Removes a stylesheet added by {@link injectStyle}. */
  export function removeStyle(id: string): void;
  /** Injects the component stylesheet into the document. */
  export function injectStyles(): void;
  /** Removes the document copy of the component stylesheet. */
  export function removeStyles(): void;
  /** Renders a view into a shadow root of `host`. */
  export function mountIsolated(
    host: HTMLElement,
    view: () => import('solid-js').JSX.Element,
  ): () => void;
  /** SVG path data for the built-in icons, keyed by name. */
  export const iconPaths: Record<IconName, readonly IconPath[]>;
  /** Registers SVG data for the current plugin setup; cleaned up when it stops. */
  export function registerIcon(name: string, definition: IconDefinition): RegisteredIcon;
  /** Creates an icon as a plain DOM element. */
  export function createIcon(name: IconSource, options?: CreateIconOptions): SVGSVGElement;

  /** A button styled like Yapin's `.btn`. */
  export const Button: import('solid-js').Component<ButtonProps>;
  /** Inline hint text in Yapin's `.hint` style. */
  export const Hint: import('solid-js').Component<HintProps>;
  /** A card-like container in Yapmod's `yp-` style. */
  export const Panel: import('solid-js').Component<PanelProps>;
  /** An inline SVG icon from Yapmod's built-in set. */
  export const Icon: import('solid-js').Component<IconProps>;
  /** A toggle switch matching Yapin's `.switch` style. */
  export const Switch: import('solid-js').Component<SwitchProps>;
  /** A single-line text field matching Yapin's `.input` style. */
  export const Input: import('solid-js').Component<InputProps>;
  /** A multi-line text field matching Yapin's `textarea.input` style. */
  export const Textarea: import('solid-js').Component<TextareaProps>;
  /** A dropdown matching Yapin's `.dd-trigger` and `.dd-menu` style. */
  export const Select: import('solid-js').Component<SelectProps>;
  /** Top-level wrapper for a settings page with title and description. */
  export const SettingsPage: import('solid-js').Component<SettingsPageProps>;
  /** Grouped block with a section heading. */
  export const Section: import('solid-js').Component<SectionProps>;
  /** A single setting row with label, hint, and control. */
  export const SettingRow: import('solid-js').Component<SettingRowProps>;
  /** A read-only setting row that displays a text value. */
  export const SettingText: import('solid-js').Component<SettingTextProps>;
  /** Horizontal separator between sections. */
  export const Divider: import('solid-js').Component<DividerProps>;
}
