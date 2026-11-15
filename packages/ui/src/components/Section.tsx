import type { SectionProps } from '@yapmod/types';

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
      <div
        class="section-label"
        style={{ 'margin-top': marginTop, 'margin-bottom': '10px', 'padding-left': '2px' }}
      >
        {props.label}
      </div>
      {props.children}
    </>
  );
}
