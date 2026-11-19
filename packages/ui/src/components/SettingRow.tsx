import type { SettingRowProps } from '@yapmod/types';

/**
 * A single setting row with a label, optional hint, and a control.
 *
 * Renders the `.toggle-row` pattern used by Yapin's native settings pages:
 * label and hint on the left, control (Switch, Button, Select, etc.) on the right.
 */
export function SettingRow(props: SettingRowProps) {
  return (
    <div class="toggle-row">
      <div>
        <div class="toggle-label">{props.label}</div>
        {props.hint ? <div class="hint">{props.hint}</div> : null}
      </div>
      {props.children}
    </div>
  );
}
