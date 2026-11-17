import type { JSX } from 'solid-js';
/** Props for the {@link SettingRow} component. */
export interface SettingRowProps {
    label: string;
    hint?: string | JSX.Element;
    children: JSX.Element;
}
/**
 * A single setting row with a label, optional hint, and a control.
 *
 * Renders the `.toggle-row` pattern used by Yapin's native settings pages:
 * label and hint on the left, control (Switch, Button, Select, etc.) on the right.
 */
export declare function SettingRow(props: SettingRowProps): JSX.Element;
