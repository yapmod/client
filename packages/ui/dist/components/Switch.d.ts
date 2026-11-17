import type { JSX } from 'solid-js';
/** Props for the {@link Switch} component. */
export type SwitchProps = Omit<JSX.IntrinsicElements['input'], 'type' | 'checked' | 'onChange'> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
};
/**
 * A toggle styled by Yapmod's stylesheet to match Yapin's `.switch`.
 *
 * It is a real checkbox under the hood, so it keeps the native keyboard
 * behaviour (space toggles it) and the host's own focus ring. The switch is
 * controlled when `checked` is given and uncontrolled otherwise.
 */
export declare function Switch(props: SwitchProps): JSX.Element;
