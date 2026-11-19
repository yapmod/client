import { For } from 'solid-js';
import type { JSX } from 'solid-js';
import type { IconProps } from '@yapmod/types';
import { iconPaths } from '../icons';

/**
 * An inline SVG icon.
 *
 * The paths are filled with `currentColor` (so the icon follows the
 * surrounding text) and carry their own fill rule, so the icon never needs a
 * stylesheet.
 */
export function Icon(props: IconProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.size ?? 16}
      height={props.size ?? 16}
      fill="currentColor"
      role={props.label ? 'img' : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : 'true'}
      class={props.class}
    >
      <For each={iconPaths[props.name]}>
        {(path) => <path d={path.d} fill-rule={path.fillRule} />}
      </For>
    </svg>
  );
}
