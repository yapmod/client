import { splitProps } from 'solid-js';
import type { IconButtonProps } from '@yapmod/types';
import { cx } from '../cx';

export function IconButton(props: IconButtonProps) {
  const [local, rest] = splitProps(props, ['active', 'variant', 'class', 'classList']);
  return (
    <button
      type="button"
      aria-pressed={local.active}
      {...rest}
      class={cx(
        'yp-icon-btn',
        { 'yp-icon-btn--active': local.active, 'yp-icon-btn--danger': local.variant === 'danger' },
        local.class,
        local.classList,
      )}
    />
  );
}
