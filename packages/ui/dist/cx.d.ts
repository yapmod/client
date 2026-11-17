/**
 * Joins class names.
 *
 * `list` accepts a plain string and/or the `classList` object Solid uses, so
 * components can accept both without the two fighting over the `class`
 * attribute.
 */
export declare function cx(...parts: Array<string | false | null | undefined | Record<string, boolean | undefined>>): string;
