import type { JSX } from 'solid-js';
/** Props for the {@link Textarea} component. */
export type TextareaProps = Omit<JSX.IntrinsicElements['textarea'], 'value' | 'onChange'> & {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
};
/**
 * A multi-line text field styled by Yapmod's stylesheet to match Yapin's
 * `textarea.input`.
 *
 * It behaves like {@link Input}: controlled when `value` is given, uncontrolled
 * otherwise, and `onChange` always receives the new text.
 */
export declare function Textarea(props: TextareaProps): JSX.Element;
