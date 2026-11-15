import type { JSX } from 'solid-js';

export type SectionSpacing = 'normal' | 'large';

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
export function Section(props: SectionProps) {
  const marginTop = props.spacing === 'large' ? '22px' : '18px';

  return (
    <>
      <div class="section-label" style={{ 'margin-top': marginTop, 'margin-bottom': '10px' }}>
        {props.label}
      </div>
      {props.children}
    </>
  );
}
