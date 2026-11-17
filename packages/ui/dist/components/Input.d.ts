import type { JSX } from 'solid-js';
/** Props for the {@link Input} component. */
export type InputProps = Omit<JSX.IntrinsicElements['input'], 'value' | 'onChange'> & {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
};
/**
 * A single-line text field styled by Yapmod's stylesheet to match Yapin's
 * `.input`.
 *
 * The input is controlled when `value` is given and uncontrolled otherwise;
 * `onChange` always receives the new text. The remaining props (placeholder,
 * disabled, maxlength, …) are passed straight to the element.
 */
export declare function Input(props: InputProps): JSX.Element;
