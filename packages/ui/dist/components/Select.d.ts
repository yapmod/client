import type { JSX } from 'solid-js';
/** A single dropdown option with a value, label, and optional disabled state. */
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
/** Props for the {@link Select} component. */
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
/**
 * A dropdown styled by Yapmod's stylesheet to match Yapin's `.dd-trigger` and
 * `.dd-menu`.
 *
 * The trigger is a button with `role="combobox"`; the option list is a
 * `listbox` that the trigger points at with `aria-activedescendant`, so the
 * keyboard interaction matches Yapin's own dropdown: arrow keys move the
 * highlight, Enter picks the highlighted option and Escape closes the list.
 *
 * The select is controlled when `value` is given and uncontrolled otherwise.
 */
export declare function Select(props: SelectProps): JSX.Element;
