import type { PanelProps } from '@yapmod/types';

/**
 * A card surface that matches Yapin's `.ss2-card`.
 *
 * Styling comes from the shared stylesheet (`.yp-card`) and follows the host
 * theme variables. When rendered inside Yapin, pass the host class
 * (`ss2-card`) as well so the host's descendant rules apply too.
 */
export function Panel(props: PanelProps) {
  return <div {...props} classList={{ 'yp-card': true, ...props.classList }} />;
}
