import type { JSX } from 'solid-js';
/** Props for the {@link Button} component. */
export type ButtonProps = JSX.IntrinsicElements['button'] & {
    variant?: 'default' | 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
    size?: 'medium' | 'small';
};
/**
 * A button styled by Yapmod's own stylesheet to match Yapin's `.btn`.
 *
 * It carries `yp-` classes only: colors, hover and focus states come from
 * the bundled CSS, which prefers the host theme variables when they exist.
 */
export declare function Button(props: ButtonProps): JSX.Element;
