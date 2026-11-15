import { createSignal, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { cx } from '../cx';

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
export function Switch(props: SwitchProps) {
  const [local, rest] = splitProps(props, [
    'checked',
    'defaultChecked',
    'onChange',
    'class',
    'classList',
  ]);

  const [internal, setInternal] = createSignal(local.defaultChecked ?? false);
  const isControlled = () => local.checked !== undefined;
  const current = () => (isControlled() ? (local.checked ?? false) : internal());

  const handleChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const next = event.currentTarget.checked;
    if (!isControlled()) setInternal(next);
    local.onChange?.(next);
  };

  return (
    <input
      {...rest}
      type="checkbox"
      role="switch"
      class={cx('yp-switch', local.class, local.classList)}
      checked={current()}
      onChange={handleChange}
    />
  );
}
