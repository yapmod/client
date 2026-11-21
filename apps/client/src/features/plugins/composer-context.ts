type RecordValue = Record<string, unknown>;

export function record(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null;
}

export function expando(element: Element, prefix: string): unknown {
  const key = Object.keys(element).find((name) => name.startsWith(prefix));
  return key ? Reflect.get(element, key) : undefined;
}

// Yapin has no public command extension point. Keep this structural, bounded adapter
// here (no React imports or bundle module IDs), refresh it after DOM changes, and restore
// only properties we still own. Event interception remains independent of suggestions.
export function composerProps(input: HTMLTextAreaElement): RecordValue[] {
  let fiber = expando(input, '__reactFiber$');
  const result: RecordValue[] = [];
  for (let depth = 0; record(fiber) && depth < 30; depth += 1, fiber = fiber.return) {
    for (const node of [fiber, fiber.alternate]) {
      if (!record(node) || !record(node.memoizedProps)) continue;
      const props = node.memoizedProps;
      if (typeof props.onSend === 'function' && 'draftKey' in props) result.push(props);
    }
    if (result.length) break;
  }
  return result;
}

/** Yapin uses channelId for server channels, DMs and group conversations alike.
 * Confirm the composer draft key against its enclosing conversation, never the URL.
 */
export function composerChannelId(input: HTMLTextAreaElement): string | null {
  let fiber = expando(input, '__reactFiber$');
  if (!record(fiber)) return null;
  // DOM fibers may point at the alternate after a React commit.
  let root = fiber;
  for (let depth = 0; record(root.return) && depth < 100; depth++) root = root.return;
  if (record(root.stateNode) && root.stateNode.current !== root) fiber = fiber.alternate;
  let draftKey: string | undefined;
  for (let depth = 0; record(fiber) && depth < 30; depth++, fiber = fiber.return) {
    const props = fiber.memoizedProps;
    if (!record(props)) continue;
    if (draftKey === undefined && typeof props.onSend === 'function') {
      if (typeof props.draftKey !== 'string' || !props.draftKey) return null;
      draftKey = props.draftKey;
    } else if (draftKey !== undefined && 'channelId' in props) {
      return props.channelId === draftKey ? draftKey : null;
    }
  }
  return null;
}
