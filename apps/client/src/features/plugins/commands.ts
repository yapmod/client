import type { PluginCommand } from '@yapmod/types';
import { showToast } from '../../lib/toast';

interface Registration {
  pluginId: string;
  command: PluginCommand;
  controller: AbortController;
  busy: boolean;
}

type RecordValue = Record<string, unknown>;
type Provider = () => unknown;
interface Patch {
  props: RecordValue;
  original: Provider | undefined;
  wrapped: Provider;
}

const selector = '.composer textarea';
const registrations = new Map<string, Registration>();
const patches = new Map<RecordValue, Patch>();
let stopWatching: (() => void) | undefined;

function record(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null;
}

function expando(element: Element, prefix: string): unknown {
  const key = Object.keys(element).find((name) => name.startsWith(prefix));
  return key ? (element as unknown as RecordValue)[key] : undefined;
}

// Yapin has no public command extension point. Keep this structural, bounded adapter
// here (no React imports or bundle module IDs), refresh it after DOM changes, and restore
// only properties we still own. Event interception remains independent of suggestions.
function composerProps(input: HTMLTextAreaElement): RecordValue[] {
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

function nativeCommands(props: RecordValue): unknown[] {
  const provider = patches.has(props) ? patches.get(props)?.original : props.commands;
  if (typeof provider !== 'function') return [];
  const result: unknown = provider();
  if (!Array.isArray(result)) throw new TypeError('Unsupported command provider.');
  return result;
}

function hasNativeName(commands: unknown[], name: string): boolean {
  return commands.some(
    (command) =>
      record(command) &&
      typeof command.name === 'string' &&
      command.name.toLowerCase() === name &&
      command.prefix !== '!',
  );
}

function restore(patch: Patch): void {
  if (patch.props.commands === patch.wrapped) patch.props.commands = patch.original;
  patches.delete(patch.props);
}

function refresh(): void {
  const current = new Set<RecordValue>();
  for (const input of document.querySelectorAll<HTMLTextAreaElement>(selector)) {
    for (const props of composerProps(input)) {
      current.add(props);
      const previous = patches.get(props);
      if (previous && props.commands !== previous.wrapped) patches.delete(props);
      if (
        patches.has(props) ||
        (props.commands !== undefined && typeof props.commands !== 'function')
      )
        continue;
      const descriptor = Object.getOwnPropertyDescriptor(props, 'commands');
      if (!descriptor?.writable) continue;
      const original = props.commands as Provider | undefined;
      const wrapped = () => {
        const commands = original?.() ?? [];
        if (!Array.isArray(commands)) return commands;
        return [
          ...commands,
          ...Array.from(registrations.values())
            .filter(({ command }) => !hasNativeName(commands, command.name))
            .map(({ command, pluginId }) => ({
              name: command.name,
              description: command.description,
              prefix: '/',
              bot: `Yapmod · ${pluginId}`,
              botId: null,
            })),
        ];
      };
      props.commands = wrapped;
      patches.set(props, { props, original, wrapped });
    }
  }
  for (const patch of patches.values()) if (!current.has(patch.props)) restore(patch);
}

function report(error: unknown): void {
  console.error('[yapmod] command integration failed', error);
  showToast('Yapmod could not run this command. Your draft was kept.', 'error');
}

function safelyRefresh(): void {
  try {
    refresh();
  } catch (error) {
    console.error('[yapmod] command suggestions unavailable', error);
  }
}

function match(input: HTMLTextAreaElement): { entry: Registration; args: string } | undefined {
  const parsed = /^\/([a-z0-9_-]{1,32})(?:\s+([\s\S]*))?$/i.exec(input.value.trim());
  const name = parsed?.[1]?.toLowerCase();
  const entry = name ? registrations.get(name) : undefined;
  return entry ? { entry, args: parsed?.[2]?.trim() ?? '' } : undefined;
}

function clearDraft(input: HTMLTextAreaElement): void {
  const props = expando(input, '__reactProps$');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (!record(props) || typeof props.onChange !== 'function' || !setter) {
    throw new Error('Unsupported composer input.');
  }
  const previous = input.value;
  try {
    setter.call(input, '');
    // Update React's draft as well as the DOM. A DOM-only clear can resend stale text.
    props.onChange({ target: input, currentTarget: input });
  } catch (error) {
    setter.call(input, previous);
    throw error;
  }
}

function submit(input: HTMLTextAreaElement, event: Event): void {
  const found = match(input);
  if (!found) return;
  // Consume the submission before inspecting host internals: an unsupported host must
  // never turn a registered local command into an outgoing message or bot invocation.
  event.preventDefault();
  event.stopImmediatePropagation();
  const { entry, args } = found;
  if (entry.busy) {
    showToast(`/${entry.command.name} is still running.`, 'error');
    return;
  }
  try {
    const props = composerProps(input)[0];
    if (!props) throw new Error('Unsupported composer.');
    if (input.disabled || props.locked || (Array.isArray(props.files) && props.files.length)) {
      showToast('Use commands in an unlocked composer without attachments.', 'error');
      return;
    }
    if (hasNativeName(nativeCommands(props), entry.command.name)) {
      showToast(
        `/${entry.command.name} conflicts with a native command. Disable the plugin to use it.`,
        'error',
      );
      return;
    }
    clearDraft(input);
  } catch (error) {
    report(error);
    return;
  }
  entry.busy = true;
  void (async () => {
    try {
      await entry.command.execute({ args, signal: entry.controller.signal });
    } catch (error) {
      console.error(`[yapmod] command /${entry.command.name} failed (${entry.pluginId})`, error);
      if (!entry.controller.signal.aborted)
        showToast(`/${entry.command.name} failed. See the console for details.`, 'error');
    } finally {
      entry.busy = false;
    }
  })();
}

function watch(): () => void {
  const events = new AbortController();
  const options = { capture: true, signal: events.signal };
  const composing = new WeakSet<HTMLTextAreaElement>();
  const observer = new MutationObserver(safelyRefresh);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('input', safelyRefresh, options);
  document.addEventListener('focusin', safelyRefresh, options);
  document.addEventListener(
    'compositionstart',
    (event) => {
      if (event.target instanceof HTMLTextAreaElement) composing.add(event.target);
    },
    options,
  );
  document.addEventListener(
    'compositionend',
    (event) => {
      if (event.target instanceof HTMLTextAreaElement) composing.delete(event.target);
    },
    options,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLTextAreaElement) || !input.matches(selector)) return;
      safelyRefresh();
      if (event.key !== 'Enter' || !match(input)) return;
      if (event.isComposing || composing.has(input) || event.keyCode === 229) {
        event.stopImmediatePropagation();
        return;
      }
      if (event.shiftKey) return;
      if (event.altKey || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      // Let Yapin complete the highlighted longer command before we execute an exact match.
      const selected = input
        .closest('.composer')
        ?.querySelector('.mention-menu [aria-selected="true"]');
      const prefix = selected?.querySelector('.mention-all');
      const selectedName = prefix?.nextElementSibling?.textContent;
      const enteredName = match(input)?.entry.command.name;
      if (
        prefix?.textContent === '/' &&
        selectedName &&
        enteredName &&
        /^[a-z0-9_-]{1,32}$/.test(selectedName) &&
        selectedName !== enteredName &&
        selectedName.startsWith(enteredName) &&
        input.value.trim() === `/${enteredName}`
      )
        return;
      if (event.repeat) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      submit(input, event);
    },
    options,
  );
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('.composer .send-btn');
      const input = button?.closest('.composer')?.querySelector<HTMLTextAreaElement>('textarea');
      if (input) submit(input, event);
    },
    options,
  );
  document.addEventListener(
    'submit',
    (event) => {
      if (!(event.target instanceof Element)) return;
      const input = event.target.querySelector<HTMLTextAreaElement>(selector);
      if (input) submit(input, event);
    },
    options,
  );
  safelyRefresh();
  return () => {
    events.abort();
    observer.disconnect();
    for (const patch of patches.values()) restore(patch);
  };
}

/** Validate before deferring installation during a transactional plugin reload. */
export function validateCommand(pluginId: string, command: PluginCommand): PluginCommand {
  if (!command || typeof command.name !== 'string' || !/^[a-z0-9_-]{1,32}$/.test(command.name)) {
    throw new TypeError(
      'Command names must contain 1–32 lowercase letters, digits, underscores or hyphens, without /.',
    );
  }
  if (command.name === 'timestamp') throw new TypeError('/timestamp is reserved by Yapin.');
  if (
    typeof command.description !== 'string' ||
    !command.description.trim() ||
    command.description.length > 200
  ) {
    throw new TypeError('Command descriptions must contain 1–200 characters.');
  }
  if (typeof command.execute !== 'function')
    throw new TypeError('Commands require an execute callback.');
  const existing = registrations.get(command.name);
  if (existing && existing.pluginId !== pluginId)
    throw new Error(`/${command.name} is already registered.`);
  return { name: command.name, description: command.description.trim(), execute: command.execute };
}

export function registerCommand(pluginId: string, command: PluginCommand): () => void {
  if (registrations.has(command.name)) throw new Error(`/${command.name} is already registered.`);
  const entry: Registration = { pluginId, command, controller: new AbortController(), busy: false };
  registrations.set(command.name, entry);
  stopWatching ??= watch();
  return () => {
    if (registrations.get(command.name) !== entry) return;
    registrations.delete(command.name);
    entry.controller.abort();
    if (!registrations.size) {
      stopWatching?.();
      stopWatching = undefined;
    }
  };
}
