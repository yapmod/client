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

/** A path using theme-aware fill or stroke colors. */
export interface IconPath {
  d: string;
  fillRule?: 'nonzero' | 'evenodd';
}

/** Inline SVG data; external resources and arbitrary markup are not supported. */
export interface IconDefinition {
  /** Defaults to `0 0 24 24`. Width and height must be positive. */
  viewBox?: string;
  paths: readonly IconPath[];
  /** Defaults to `currentColor`. */
  fill?: 'currentColor' | 'none';
  /** Defaults to `none`. */
  stroke?: 'currentColor' | 'none';
  strokeWidth?: number;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
}

declare const registeredIcon: unique symbol;
/** Opaque, runtime-only reference returned by `ui.registerIcon`. */
export interface RegisteredIcon {
  readonly [registeredIcon]: true;
}

export type IconSource = IconName | RegisteredIcon;

/** Props for the `Icon` component. */
export type IconProps = {
  name: IconSource;
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

export interface TabsProps<Value extends string = string> {
  variant?: 'underline' | 'pills';
  label: string;
  value: Value;
  options: readonly { value: Value; label: JSX.Element; disabled?: boolean }[];
  disabled?: boolean;
  onChange: (value: Value) => void;
  children: JSX.Element;
}

export type BadgeProps = JSX.IntrinsicElements['span'] & {
  variant?: 'default' | 'mention';
};

export type IconButtonProps = JSX.IntrinsicElements['button'] & {
  'aria-label': string;
  active?: boolean;
  variant?: 'default' | 'danger';
};
