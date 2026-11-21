import type { IconDefinition, IconSource, RegisteredIcon } from '@yapmod/types';
import { createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';
import { iconPaths } from './icons';

const definitions = new WeakMap<RegisteredIcon, Accessor<IconDefinition | undefined>>();

export function isIconSource(value: unknown): value is IconSource {
  return typeof value === 'string'
    ? Object.prototype.hasOwnProperty.call(iconPaths, value)
    : typeof value === 'object' && value !== null && definitions.has(value as RegisteredIcon);
}

export function resolveIcon(source: IconSource): IconDefinition {
  if (typeof source === 'string' && Object.prototype.hasOwnProperty.call(iconPaths, source)) {
    return { paths: iconPaths[source] };
  }
  return definitions.get(source as RegisteredIcon)?.() ?? { paths: iconPaths.puzzle };
}

function normalizeDefinition(value: IconDefinition): IconDefinition {
  if (!value || typeof value !== 'object' || !Array.isArray(value.paths) || !value.paths.length) {
    throw new TypeError('An icon must contain at least one SVG path.');
  }
  const viewBox = value.viewBox ?? '0 0 24 24';
  const bounds =
    typeof viewBox === 'string'
      ? viewBox
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      : [];
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    (bounds[2] ?? 0) <= 0 ||
    (bounds[3] ?? 0) <= 0
  ) {
    throw new TypeError('Icon viewBox must contain four finite numbers and positive dimensions.');
  }
  const choices = {
    fill: ['currentColor', 'none'],
    stroke: ['currentColor', 'none'],
    strokeLinecap: ['butt', 'round', 'square'],
    strokeLinejoin: ['miter', 'round', 'bevel'],
  } as const;
  for (const key of Object.keys(choices) as (keyof typeof choices)[]) {
    if (value[key] !== undefined && !(choices[key] as readonly unknown[]).includes(value[key])) {
      throw new TypeError(`Invalid icon ${key}.`);
    }
  }
  if (
    value.strokeWidth !== undefined &&
    (!Number.isFinite(value.strokeWidth) || value.strokeWidth < 0)
  ) {
    throw new TypeError('Icon strokeWidth must be a finite nonnegative number.');
  }
  return Object.freeze({
    viewBox: bounds.join(' '),
    fill: value.fill,
    stroke: value.stroke,
    strokeWidth: value.strokeWidth,
    strokeLinecap: value.strokeLinecap,
    strokeLinejoin: value.strokeLinejoin,
    paths: Object.freeze(
      Array.from(value.paths, (path) => {
        if (
          !path ||
          typeof path.d !== 'string' ||
          !path.d.trim() ||
          (path.fillRule !== undefined &&
            path.fillRule !== 'evenodd' &&
            path.fillRule !== 'nonzero')
        ) {
          throw new TypeError('Invalid SVG icon path.');
        }
        return Object.freeze({ d: path.d, fillRule: path.fillRule });
      }),
    ),
  });
}

/** Each setup attempt owns its references, so a failed reload cannot replace live icons. */
export function createIconRegistry() {
  const names = new Set<string>();
  const cleanups: (() => void)[] = [];
  let disposed = false;
  return {
    registerIcon(name: string, definition: IconDefinition): RegisteredIcon {
      if (disposed) throw new Error('Cannot register icons after disposal.');
      if (typeof name !== 'string' || !name.trim())
        throw new TypeError('Icon name must be non-empty.');
      const key = name.trim();
      if (names.has(key)) throw new Error(`Duplicate icon name: ${key}`);
      const normalized = normalizeDefinition(definition);
      const reference = Object.freeze({}) as RegisteredIcon;
      const [read, write] = createSignal<IconDefinition | undefined>(normalized);
      definitions.set(reference, read);
      names.add(key);
      cleanups.push(() => write(undefined));
      return reference;
    },
    dispose() {
      disposed = true;
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch (error) {
          console.error('[yapmod] icon cleanup failed', error);
        }
      }
      cleanups.length = 0;
      names.clear();
    },
  };
}
