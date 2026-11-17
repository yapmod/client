import type { JSX } from 'solid-js';
/** Names of the built-in icons. */
export type IconName = 'settings' | 'puzzle' | 'trash' | 'palette' | 'upload' | 'refresh' | 'plus' | 'pencil' | 'close';
/** Props for the {@link Icon} component. */
export type IconProps = {
    name: IconName;
    size?: number;
    label?: string;
    class?: string;
};
/**
 * An inline SVG icon.
 *
 * The paths are filled with `currentColor` (so the icon follows the
 * surrounding text) and carry their own fill rule, so the icon never needs a
 * stylesheet.
 */
export declare function Icon(props: IconProps): JSX.Element;
