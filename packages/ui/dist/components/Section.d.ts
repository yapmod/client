import type { JSX } from 'solid-js';
/** Spacing variant for {@link Section}. */
export type SectionSpacing = 'normal' | 'large';
/** Props for the {@link Section} component. */
export interface SectionProps {
    label: string;
    children: JSX.Element;
    spacing?: SectionSpacing;
}
/**
 * Grouped block with a section heading.
 *
 * Renders a `.section-label` with consistent top margin, matching the pattern
 * used by Yapin's native settings pages to group related settings.
 */
export declare function Section(props: SectionProps): JSX.Element;
