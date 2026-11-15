import { splitProps } from 'solid-js';
import type { ButtonProps } from '@yapmod/types';

/**
 * A button styled by Yapmod's own stylesheet to match Yapin's `.btn`.
 *
 * It carries `yp-` classes only: colors, hover and focus states come from
 * the bundled CSS, which prefers the host theme variables when they exist.
 */
export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'classList']);

  return (
    <button
      type="button"
      {...rest}
      classList={{
        'yp-btn': true,
        'yp-btn--secondary': local.variant === 'secondary',
        'yp-btn--ghost': local.variant === 'ghost',
        'yp-btn--danger': local.variant === 'danger',
        'yp-btn--small': local.size === 'small',
        ...local.classList,
      }}
    />
  );
}
