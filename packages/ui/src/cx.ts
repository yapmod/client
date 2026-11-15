/**
 * Joins class names.
 *
 * `list` accepts a plain string and/or the `classList` object Solid uses, so
 * components can accept both without the two fighting over the `class`
 * attribute.
 */
export function cx(
  ...parts: Array<string | false | null | undefined | Record<string, boolean | undefined>>
): string {
  const names: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      names.push(part);
      continue;
    }
    for (const [name, enabled] of Object.entries(part)) {
      if (enabled) names.push(name);
    }
  }

  return names.join(' ');
}
