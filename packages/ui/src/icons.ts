/** SVG path data for the built-in icons. */

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

const paths = {
  /** Options and configuration. */
  settings: [
    {
      d: 'M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
      fillRule: 'evenodd',
    },
  ],
  /** Mods and add-ons. */
  puzzle: [
    {
      d: 'M18.559 12.8227C17.7884 13.4957 16.6663 13.3616 15.9404 12.641C14.7975 11.5063 11.4931 8.21104 11.4931 8.21104C10.897 7.63087 10.897 6.44662 11.4931 5.85464C12.319 5.03435 13.6053 3.75146 13.6053 3.75146C13.9641 3.39195 14.456 3.18972 14.9653 3.18886L18.3363 3.18425L19.5255 2L22.5 4.96048L21.3108 6.14473L21.3021 9.50878C21.2992 10.0164 21.0967 10.5026 20.735 10.8613C20.735 10.8613 19.5718 11.9384 18.559 12.8227ZM15.2315 13.9548L13.4954 15.8273C14.0972 16.4265 14.0972 16.9113 13.64 17.6997L11.3976 20.2485C11.0359 20.6081 10.5469 20.8103 10.0347 20.8111L6.66378 20.8158L5.47455 22L2.5 19.0395L3.68927 17.8553L3.70082 14.4912C3.70082 13.9836 3.90338 13.4974 4.26507 13.1387L6.37153 11.0404C6.96759 10.4485 8.15685 10.4485 8.73844 11.0404L8.74424 11.0465L10.5295 9.26998L11.7188 10.4542L9.93347 12.2305L12.3119 14.599L14.0972 12.8227L15.2315 13.9548Z',
    },
  ],
  /** Remove or clear content. */
  trash: [
    { d: 'M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z' },
    {
      d: 'M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z',
    },
  ],
  /** Themes and visual customization. */
  palette: [
    {
      d: 'M15.35 7.24C15.9 6.67 16 5.8 16 5a3 3 0 1 1 3 3c-.8 0-1.67.09-2.24.65a1.5 1.5 0 0 0 0 2.11l1.12 1.12a3 3 0 0 1 0 4.24l-5 5a3 3 0 0 1-4.25 0l-5.76-5.75a3 3 0 0 1 0-4.24l4.04-4.04.97-.97a3 3 0 0 1 4.24 0l1.12 1.12c.58.58 1.52.58 2.1 0ZM6.9 9.9 4.3 12.54a1 1 0 0 0 0 1.42l2.17 2.17.83-.84a1 1 0 0 1 1.42 1.42l-.84.83.59.59 1.83-1.84a1 1 0 0 1 1.42 1.42l-1.84 1.83.17.17a1 1 0 0 0 1.42 0l2.63-2.62L6.9 9.9Z',
      fillRule: 'evenodd',
    },
  ],
  /** Bring content into the page. */
  upload: [
    {
      d: 'M12 2a1 1 0 0 1 .71.29l4 4a1 1 0 0 1-1.42 1.42L13 5.41V15a1 1 0 1 1-2 0V5.41L8.71 7.71a1 1 0 0 1-1.42-1.42l4-4A1 1 0 0 1 12 2Z',
    },
    {
      d: 'M4 14a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3a1 1 0 1 1 2 0v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3a1 1 0 0 1 1-1Z',
    },
  ],
  /** Reload or refresh content. */
  refresh: [
    {
      d: 'M4 12a8 8 0 0 1 14.93-4H15a1 1 0 1 0 0 2h6a1 1 0 0 0 1-1V3a1 1 0 1 0-2 0v3a9.98 9.98 0 0 0-18 6 10 10 0 0 0 16.29 7.78 1 1 0 0 0-1.26-1.56A8 8 0 0 1 4 12Z',
    },
  ],
  /** Add a new item. */
  plus: [{ d: 'M15 10H10V15H8V10H3V8H8V3H10V8H15V8Z' }],
  /** Edit existing content. */
  pencil: [
    {
      d: 'm13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z',
    },
  ],
  /** Close a dialog or remove a temporary view. */
  close: [
    {
      d: 'M6.4 5A1 1 0 0 0 5 6.4L10.6 12 5 17.6A1 1 0 1 0 6.4 19L12 13.4 17.6 19a1 1 0 0 0 1.4-1.4L13.4 12 19 6.4A1 1 0 0 0 17.6 5L12 10.6 6.4 5Z',
    },
  ],
} as const;

/** Names of the built-in icons. */
export type IconName = keyof typeof paths;

/** SVG path data for the built-in icons, keyed by name. */
export const iconPaths: Record<IconName, readonly IconPath[]> = paths;

const SVG_NS = 'http://www.w3.org/2000/svg';

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
export function createIcon(name: IconName, options?: CreateIconOptions): SVGSVGElement {
  const size = options?.size ?? 16;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  if (options?.class) svg.setAttribute('class', options.class);

  for (const path of iconPaths[name]) {
    const element = document.createElementNS(SVG_NS, 'path');
    element.setAttribute('d', path.d);
    if (path.fillRule) element.setAttribute('fill-rule', path.fillRule);
    svg.append(element);
  }

  return svg;
}
