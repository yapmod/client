import { createSignal } from 'solid-js';

/*
 * The state of the dev connection, shown in the settings panel.
 *
 * The client itself never polls anything: the dev server pushes builds in,
 * so this only records what came in and when.
 */

export interface DevStatus {
  /** Whether a dev server has pushed a build in this session. */
  connected: boolean;
  /** Name of the plugin the dev server is serving. */
  plugin?: string;
  /** The last error, if the last build failed to apply. */
  error?: string;
  /** When the last build was applied. */
  updatedAt?: number;
}

const [status, setStatus] = createSignal<DevStatus>({ connected: false });

/** The current dev status. */
export function devStatus(): DevStatus {
  return status();
}

/** Records a successful hot reload. */
export function reportDevUpdate(plugin: string): void {
  setStatus({ connected: true, plugin, updatedAt: Date.now() });
}

/** Records a failed hot reload. */
export function reportDevError(plugin: string | undefined, error: string): void {
  setStatus({ connected: plugin !== undefined, plugin, error, updatedAt: Date.now() });
}
