/**
 * A horizontal separator between sections.
 *
 * Renders a styled `<hr>` element that matches Yapin's visual theme using
 * CSS variables for the border color.
 */
export function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        'border-top': '1px solid var(--border)',
        margin: '18px 0',
      }}
    />
  );
}
