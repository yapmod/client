import { splitProps } from 'solid-js';
import type { BadgeProps } from '@yapmod/types';
import { cx } from '../cx';

export function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ['variant', 'class', 'classList']);
  return (
    <span
      {...rest}
      class={cx(
        'yp-badge',
        { 'yp-badge--mention': local.variant === 'mention' },
        local.class,
        local.classList,
      )}
    />
  );
}
