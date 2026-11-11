import type { JSX } from 'solid-js';

export type HintProps = JSX.IntrinsicElements['span'];

/** Secondary helper text that matches Yapin's `.hint`. */
export function Hint(props: HintProps) {
  return <span {...props} classList={{ 'yp-hint': true, ...props.classList }} />;
}
