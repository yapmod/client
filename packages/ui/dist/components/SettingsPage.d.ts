import type { JSX } from 'solid-js';
/** Props for the {@link SettingsPage} component. */
export interface SettingsPageProps {
    title: string;
    description?: string;
    children: JSX.Element;
}
/**
 * Top-level wrapper for a settings page.
 *
 * Renders the page title and optional description, matching the pattern used
 * by Yapin's native settings pages (`<h2>` + `.hint` with `margin-bottom`).
 */
export declare function SettingsPage(props: SettingsPageProps): JSX.Element;
