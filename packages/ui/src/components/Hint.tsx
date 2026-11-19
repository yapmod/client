import type { HintProps } from '@yapmod/types';

/** Secondary helper text that matches Yapin's `.hint`. */
export function Hint(props: HintProps) {
  return <span {...props} classList={{ 'yp-hint': true, ...props.classList }} />;
}
