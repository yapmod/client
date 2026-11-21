export interface Runtime {
  c: Map<unknown, { exports?: unknown }>;
}
export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

let discovery: Promise<Runtime> | undefined;

export function runtime(): Promise<Runtime> {
  if (discovery) return discovery;
  const queue = (globalThis as { TURBOPACK?: unknown }).TURBOPACK;
  if (!record(queue) || Array.isArray(queue) || typeof queue.push !== 'function')
    return Promise.reject(new Error('Yapin app API is not ready.'));
  const push = queue.push.bind(queue);
  discovery = new Promise<Runtime>((resolve, reject) => {
    const id = `yapmod-calls-${globalThis.crypto.randomUUID()}`;
    const timeout = globalThis.setTimeout(
      () => reject(new Error('Yapin app discovery timed out.')),
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
