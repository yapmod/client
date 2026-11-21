import { For } from 'solid-js';
import type { JSX } from 'solid-js';
import type { IconProps } from '@yapmod/types';
import { resolveIcon } from '../registry';

/**
 * An inline SVG icon.
 *
 * Fill and stroke use `currentColor` so artwork follows the surrounding
 * text without a stylesheet.
 */
export function Icon(props: IconProps): JSX.Element {
  const definition = () => resolveIcon(props.name);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={definition().viewBox ?? '0 0 24 24'}
      width={props.size ?? 16}
      height={props.size ?? 16}
      fill={definition().fill ?? 'currentColor'}
      stroke={definition().stroke ?? 'none'}
      stroke-width={definition().strokeWidth}
      stroke-linecap={definition().strokeLinecap}
      stroke-linejoin={definition().strokeLinejoin}
      role={props.label ? 'img' : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : 'true'}
      class={props.class}
    >
      <For each={definition().paths}>{(path) => <path d={path.d} fill-rule={path.fillRule} />}</For>
    </svg>
  );
}
