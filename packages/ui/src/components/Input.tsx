import { createSignal, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { cx } from '../cx';

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
export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'value',
    'defaultValue',
    'onChange',
    'class',
    'classList',
  ]);

  const [internal, setInternal] = createSignal(local.defaultValue ?? '');
  const isControlled = () => local.value !== undefined;
  const current = () => (isControlled() ? (local.value ?? '') : internal());

  const handleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const next = event.currentTarget.value;
    if (!isControlled()) setInternal(next);
    local.onChange?.(next);
  };

  return (
    <input
      {...rest}
      class={cx('yp-input', local.class, local.classList)}
      value={current()}
      onInput={handleInput}
    />
  );
}
