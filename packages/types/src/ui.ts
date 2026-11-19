import type { JSX } from 'solid-js';

/*
 * Prop contracts for the components exported by `@yapmod/ui`.
 *
 * These types are the single source of truth shared by the public types
 * package, the Solid implementation in `packages/ui`, and the ambient
 * `@yapmod/ui` module that plugin authors type-check against. Keeping them
 * here means the package published to npm and the workspace implementation
 * cannot drift apart.
 */

/** Props for the `Button` component. */
export type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'default' | 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'medium' | 'small';
};

/** Props for the `Divider` component (takes no props). */
export type DividerProps = {};

/** Props for the `Hint` component. */
export type HintProps = JSX.IntrinsicElements['span'];

/** Names of the built-in icons. */
export type IconName =
  | 'settings'
  | 'puzzle'
  | 'trash'
  | 'palette'
  | 'upload'
  | 'refresh'
  | 'plus'
  | 'pencil'
  | 'close';

/** Props for the `Icon` component. */
export type IconProps = {
  name: IconName;
  size?: number;
  label?: string;
  class?: string;
};

/** Props for the `Input` component. */
export type InputProps = Omit<JSX.IntrinsicElements['input'], 'value' | 'onChange'> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

/** Props for the `Panel` component. */
export type PanelProps = JSX.IntrinsicElements['div'];

/** Spacing variant for `Section`. */
export type SectionSpacing = 'normal' | 'large';

/** Props for the `Section` component. */
export interface SectionProps {
  label: string;
  children: JSX.Element;
  spacing?: SectionSpacing;
}

/** A single dropdown option with a value, label, and optional disabled state. */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Props for the `Select` component. */
export type SelectProps = {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  class?: string;
  classList?: Record<string, boolean | undefined>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

/** Props for the `SettingRow` component. */
export interface SettingRowProps {
  label: string;
  hint?: string | JSX.Element;
  children: JSX.Element;
}

/** Props for the `SettingText` component. */
export interface SettingTextProps {
  label: string;
  hint?: string;
  value: string | JSX.Element;
}

/** Props for the `SettingsPage` component. */
export interface SettingsPageProps {
  title: string;
  description?: string;
  children: JSX.Element;
}

/** Props for the `Switch` component. */
export type SwitchProps = Omit<JSX.IntrinsicElements['input'], 'type' | 'checked' | 'onChange'> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
};

/** Props for the `Textarea` component. */
export type TextareaProps = Omit<JSX.IntrinsicElements['textarea'], 'value' | 'onChange'> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};
