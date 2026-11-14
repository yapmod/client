/*
 * The wire format between the builder's dev server and the client.
 *
 * Both sides speak `window.postMessage`, which no Content-Security-Policy
 * directive covers — that is the whole reason the dev server pushes code
 * instead of letting the page fetch it. `connect-src` would block a page
 * side request to `http://127.0.0.1:5173`, but a message between two
 * windows passes through untouched.
 */

/** The dev server pushes a new build into the Yapin page. */
export const DEV_UPDATE = 'yapmod:dev:update';

/** The Yapin page announces itself to the dev server's control page. */
export const DEV_HELLO = 'yapmod:dev:hello';

/** The Yapin page answers the control page's probe. */
export const DEV_READY = 'yapmod:dev:ready';

/** The Yapin page reports the outcome of an update back to the dev server. */
export const DEV_STATUS = 'yapmod:dev:status';

/** What the dev server sends with every rebuild. */
export interface DevUpdatePayload {
  /** Id of the dev plugin, e.g. `dev:my-plugin`. */
  id: string;
  name: string;
  author: string;
  description: string;
  version?: string;
  /** The plugin expression, ready to be evaluated by the client. */
  code: string;
}

/** What the client answers with after applying an update. */
export interface DevStatusPayload {
  ok: boolean;
  message?: string;
}
