import type { LoadedMessage, MessageAttachment, PluginMessages } from '@yapmod/types';
import type { PluginScope } from './scope';

interface Runtime {
  c: Map<unknown, { exports?: unknown }>;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

let discovery: Promise<Runtime> | undefined;

function runtime(): Promise<Runtime> {
  if (discovery) return discovery;
  const queue = (globalThis as { TURBOPACK?: unknown }).TURBOPACK;
  if (!record(queue) || Array.isArray(queue) || typeof queue.push !== 'function')
    return Promise.reject(new Error('Yapin message API is not ready.'));
  const push = queue.push.bind(queue);
  discovery = new Promise<Runtime>((resolve, reject) => {
    const id = `yapmod-messages-${globalThis.crypto.randomUUID()}`;
    const timeout = globalThis.setTimeout(
      () => reject(new Error('Yapin message discovery timed out.')),
      3000,
    );
    const fail = (error: unknown) => {
      globalThis.clearTimeout(timeout);
      reject(error);
    };
    try {
      push([
        id,
        id,
        (value: Runtime) => {
          globalThis.clearTimeout(timeout);
          if (!(value?.c instanceof Map)) reject(new Error('Unsupported Yapin runtime.'));
          else resolve(value);
        },
      ]);
      Promise.resolve(push([id, { otherChunks: [], runtimeModuleIds: [id] }])).catch(fail);
    } catch (error) {
      fail(error);
    }
  }).catch((error: unknown) => {
    discovery = undefined;
    throw error;
  });
  return discovery;
}

// Observed in Yapin's loaded store on 2026-11-22. findMessage scans
// messages[channelId], then extraMessages[id]; it never fetches history.
function findStore(host: Runtime): { findMessage(id: string): unknown } | undefined {
  for (const module of host.c.values()) {
    try {
      const value = module.exports;
      if (
        !record(value) ||
        typeof value.getState !== 'function' ||
        typeof value.findMessage !== 'function'
      )
        continue;
      const state: unknown = value.getState();
      if (
        record(state) &&
        record(state.messages) &&
        !Array.isArray(state.messages) &&
        record(state.extraMessages) &&
        !Array.isArray(state.extraMessages) &&
        record(state.profiles)
      ) {
        return value as unknown as { findMessage(id: string): unknown };
      }
    } catch {
      /* Ignore unrelated or incompatible exports. */
    }
  }
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
function identifier(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function size(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function snapshot(value: unknown, id: string): LoadedMessage | undefined {
  if (!record(value) || value.id !== id) return;
  const path = identifier(value.attachment_path);
  let attachments: readonly MessageAttachment[] | undefined;
  if (value.attachment_path === null) attachments = Object.freeze([]);
  else if (path)
    attachments = Object.freeze([
      Object.freeze({
        path,
        name: text(value.attachment_name),
        size: size(value.attachment_size),
        width: size(value.attachment_width),
        height: size(value.attachment_height),
      }),
    ]);
  const createdAt = text(value.created_at);
  return Object.freeze({
    id,
    text: text(value.content),
    authorId: identifier(value.author_id),
    channelId: identifier(value.channel_id),
    createdAt: createdAt && Number.isFinite(Date.parse(createdAt)) ? createdAt : undefined,
    attachments,
  });
}

export function createMessages(scope: PluginScope): PluginMessages {
  let active = true;
  scope.onDispose(() => {
    active = false;
  });
  function assertActive(): void {
    if (!active) throw new Error('Plugin message API has been disposed.');
  }
  return {
    async getLoaded(messageId) {
      assertActive();
      if (!identifier(messageId)) throw new TypeError('Expected a nonempty message ID.');
      let host: Runtime;
      try {
        host = await runtime();
      } catch {
        assertActive();
        return { status: 'unavailable' };
      }
      assertActive();
      try {
        const store = findStore(host);
        if (!store) return { status: 'unavailable' };
        const value = store.findMessage(messageId);
        if (value === undefined || value === null) return { status: 'not-loaded' };
        const message = snapshot(value, messageId);
        return message ? { status: 'found', message } : { status: 'unavailable' };
      } catch {
        return { status: 'unavailable' };
      }
    },
  };
}
