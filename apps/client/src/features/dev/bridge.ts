import type { Client } from '@yapmod/types';

import { showToast } from '../../lib/toast';
import { applyDevUpdate } from './apply';
import { reportDevError, reportDevUpdate } from './status';
import { developerFeatures } from '../settings/store';
import {
  DEV_HELLO,
  DEV_READY,
  DEV_STATUS,
  DEV_UPDATE,
  type DevStatusPayload,
  type DevUpdatePayload,
} from './types';

/*
 * The bridge between the builder's dev server and this client.
 *
 * The transport is `window.postMessage`. It is the only channel that
 * survives Yapin's Content-Security-Policy: `connect-src` would block a
 * page side `fetch` to the local dev server, and `script-src` would block
 * loading a script from it, but a message between two windows is not
 * covered by any directive.
 *
 * The dev server's control page opens Yapin and pushes every rebuild into
 * it. Only messages from a loopback origin are accepted, and only while
 * developer features are enabled.
 */

/**
 * True for origins a dev server may run on.
 *
 * Loopback only: a dev server is always local, and accepting an arbitrary
 * origin would let any page push code into Yapmod.
 */
export function isDevOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const host = url.hostname.replace(/^\[|\]$/g, '');
  return (
    host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Validates the payload of an update message. */
function readPayload(value: unknown): DevUpdatePayload | undefined {
  if (!isRecord(value)) return undefined;

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const code = typeof value.code === 'string' ? value.code : '';
  if (!id || !code.trim()) return undefined;

  return {
    id,
    code,
    name: typeof value.name === 'string' && value.name.trim() ? value.name : id,
    author: typeof value.author === 'string' ? value.author : 'Unknown Author',
    description: typeof value.description === 'string' ? value.description : '',
    version: typeof value.version === 'string' ? value.version : undefined,
  };
}

/** Sends a message back to the dev server. */
function reply(
  source: MessageEventSource | null,
  origin: string,
  type: string,
  payload: DevStatusPayload | { devFeatures: boolean },
): void {
  if (!source || typeof source !== 'object' || !('postMessage' in source)) return;

  try {
    (source as Window).postMessage({ type, payload }, origin);
  } catch {
    // The dev server may have gone away; there is nothing to report to.
  }
}

// The control-page protocol has one status per build stream. A slow startup
// must not overwrite a newer build's result or reopen a toast after disposal.
const pendingUpdates = new Map<string, DevUpdatePayload>();

/**
 * Handles one message from a possible dev server.
 *
 * Everything is checked before it is acted on: the origin has to be a
 * loopback address, developer features have to be on, and the payload has
 * to be a complete plugin.
 */
async function onMessage(event: MessageEvent): Promise<void> {
  if (!isDevOrigin(event.origin)) return;

  const data = event.data;
  if (!isRecord(data)) return;

  if (data.type === 'yapmod:dev:ping') {
    // The control page probes the window it opened. Answering tells it
    // which origin to push to, without ever guessing one.
    reply(event.source, event.origin, DEV_READY, { devFeatures: developerFeatures() });
    return;
  }
  if (data.type === DEV_UPDATE) {
    if (!developerFeatures()) {
      reply(event.source, event.origin, DEV_STATUS, {
        ok: false,
        message: 'Developer features are off. Enable them in Yapmod → Settings.',
      });
      return;
    }

    const payload = readPayload(data.payload);
    if (!payload) {
      reply(event.source, event.origin, DEV_STATUS, { ok: false, message: 'Malformed update.' });
      return;
    }

    pendingUpdates.set(payload.id, payload);
    const result = await applyDevUpdate(payload);
    if (pendingUpdates.get(payload.id) !== payload) return;
    pendingUpdates.delete(payload.id);
    if (!developerFeatures()) return;

    reply(event.source, event.origin, DEV_STATUS, result);

    if (result.ok) {
      reportDevUpdate(payload.name);
    } else {
      reportDevError(payload.name, result.message ?? 'unknown error');
    }

    showToast(
      result.ok
        ? `${payload.name} reloaded.`
        : `${payload.name} failed to reload: ${result.message ?? 'unknown error'}`,
      result.ok ? 'success' : 'error',
    );
    return;
  }

  if (data.type === DEV_HELLO) {
    // The Yapin page told the dev server it is there; nothing to do here.
    return;
  }
}

/**
 * Installs the dev bridge for the lifetime of the client.
 *
 * The listener is removed when the client is disposed, so a reloaded bundle
 * never leaves two bridges listening for the same messages.
 */
export function installDev(client: Client): void {
  window.addEventListener('message', onMessage);
  client.onDispose(() => window.removeEventListener('message', onMessage));

  announceToOpener();
  client.onDispose(() => pendingUpdates.clear());
}

/**
 * Announces this page to a dev server that opened it.
 *
 * `window.opener` is only set when the page was opened by another page,
 * which is exactly the dev server's control page. The message is sent with
 * a wildcard target because the opener's origin is unknown at this point.
 * The dev server is the one that verifies the sender's origin.
 */
function announceToOpener(): void {
  const opener = window.opener;
  if (!opener) return;

  try {
    opener.postMessage({ type: DEV_HELLO, payload: { devFeatures: developerFeatures() } }, '*');
  } catch {
    // A cross-origin opener may refuse the message; the dev server can still
    // push to the window it opened.
  }
}
