import type { SettingsPageProps } from '@yapmod/types';

/**
 * Top-level wrapper for a settings page.
 *
 * Renders the page title and optional description, matching the pattern used
 * by Yapin's native settings pages (`<h2>` + `.hint` with `margin-bottom`).
 */
export function SettingsPage(props: SettingsPageProps) {
  return (
    <>
      <h2>{props.title}</h2>
      {props.description ? (
        <div class="hint" style={{ 'margin-bottom': '14px' }}>
          {props.description}
        </div>
      ) : null}
      {props.children}
    </>
  );
}
