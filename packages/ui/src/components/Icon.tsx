import { For } from 'solid-js';
import type { JSX } from 'solid-js';
import { iconPaths, type IconName } from '../icons';

export type IconProps = {
  /** Which built-in icon to render. */
  name: IconName;
  /** Width and height in pixels. Defaults to 16. */
  size?: number;
  /** Accessible label. Without one the icon is decorative. */
  label?: string;
  /** Extra class on the `<svg>` element. */
  class?: string;
};

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
