import { createSignal, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { cx } from '../cx';

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
export function Textarea(props: TextareaProps) {
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

  const handleInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    const next = event.currentTarget.value;
    if (!isControlled()) setInternal(next);
    local.onChange?.(next);
  };

  return (
    <textarea
      {...rest}
      class={cx('yp-input', 'yp-textarea', local.class, local.classList)}
      value={current()}
      onInput={handleInput}
    />
  );
}
