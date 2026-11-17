/** SVG path data for the built-in icons. */
import type { IconName } from './components/Icon';
/**
 * One path of an icon.
 *
 * The icons are filled shapes, so each path carries its own fill rule. The
 * colour comes from the parent `<svg>` (`currentColor`), never from the path.
 */
export interface IconPath {
    /** SVG path data. */
    d: string;
    /** Fill rule for this path. Defaults to `nonzero`. */
    fillRule?: 'evenodd';
}
/** Names of the built-in icons, re-exported from the component. */
export { type IconName } from './components/Icon';
/** SVG path data for the built-in icons, keyed by name. */
export declare const iconPaths: Record<IconName, readonly IconPath[]>;
export type CreateIconOptions = {
    /** Width and height in pixels. Defaults to 16. */
    size?: number;
    /** Extra class on the `<svg>` element. */
    class?: string;
};
/**
 * Creates an icon as a plain DOM element.
 *
 * This is the non-Solid counterpart of the `Icon` component, for markup that
 * is built imperatively (Yapin's settings navigation). The paths are filled
 * with `currentColor`, so the icon needs no stylesheet.
 */
export declare function createIcon(name: IconName, options?: CreateIconOptions): SVGSVGElement;
