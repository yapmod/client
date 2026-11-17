import type { JSX } from 'solid-js';
/** Props for the {@link SettingText} component. */
export interface SettingTextProps {
    label: string;
    hint?: string;
    value: string | JSX.Element;
}
/**
 * A read-only setting row that displays a text value.
 *
 * Renders the `.toggle-row` pattern with a `.hint` span on the right side,
 * used for displaying information like version numbers or paths.
 */
export declare function SettingText(props: SettingTextProps): JSX.Element;
