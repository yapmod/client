import type { ComposerTool } from '@yapmod/types';
import { Button, Icon, appendStyle, isIconSource } from '@yapmod/ui';
import { ErrorBoundary, For, Show, createSignal, onCleanup } from 'solid-js';
import { render } from 'solid-js/web';
import { openModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import css from './tools.css?inline';

interface Entry {
  pluginId: string;
  tool: ComposerTool;
}

const [entries, setEntries] = createSignal<Entry[]>([]);
const mounts = new Map<HTMLElement, { host: HTMLElement; dispose(): void }>();
let stopWatching: (() => void) | undefined;

function ToolIcon(props: { entry: Entry }) {
  const icon = props.entry.tool.icon;
  if (typeof icon !== 'function') return <Icon name={icon} />;
  return (
    <span aria-hidden="true" inert class="yp-tool-art">
      <ErrorBoundary fallback={() => <Icon name="puzzle" />}>{icon()}</ErrorBoundary>
    </span>
  );
}

async function activate(entry: Entry, box: HTMLElement) {
  const input = box.querySelector('textarea');
  if (!input?.isConnected || !entries().includes(entry)) return;
  try {
    await entry.tool.onActivate({
      length: input.value.length,
      maxLength: input.maxLength < 0 ? null : input.maxLength,
      focus: () => input.focus({ preventScroll: true }),
    });
  } catch (error) {
    console.error(`[yapmod] composer tool failed: ${entry.pluginId}/${entry.tool.id}`, error);
    showToast(`${entry.tool.label} could not run.`, 'error');
  }
}

function Toolbar(props: { box: HTMLElement }) {
  const [width, setWidth] = createSignal(props.box.clientWidth);
  const resize = new ResizeObserver(() => setWidth(props.box.clientWidth));
  resize.observe(props.box);
  let closePicker: (() => void) | undefined;
  onCleanup(() => {
    resize.disconnect();
    closePicker?.();
  });

  function openPicker(trigger: HTMLButtonElement) {
    closePicker = openModal({
      title: 'Composer tools',
      content: (close) => (
        <div class="yp-tool-picker">
          <For each={entries()}>
            {(entry) => (
              <Button
                type="button"
                onClick={() => {
                  close();
                  void activate(entry, props.box);
                }}
              >
                <ToolIcon entry={entry} /> {entry.tool.label}
              </Button>
            )}
          </For>
        </div>
      ),
      onClose() {
        closePicker = undefined;
        if (trigger.isConnected) trigger.focus({ preventScroll: true });
      },
    });
  }

  // Reserve room for the draft, attachment, Send, and Yapin’s native tools.
  return (
    <Show
      when={width() >= 440 + entries().length * 36}
      fallback={
        <button
          type="button"
          class="icon-btn yp-composer-tool"
          aria-label="Composer tools"
          aria-haspopup="dialog"
          title="Composer tools"
          onClick={(event) => openPicker(event.currentTarget)}
        >
          <Icon name="puzzle" />
        </button>
      }
    >
      <For each={entries()}>
        {(entry) => (
          <button
            type="button"
            class="icon-btn yp-composer-tool"
            aria-label={entry.tool.label}
            title={entry.tool.label}
            onClick={() => void activate(entry, props.box)}
          >
            <ToolIcon entry={entry} />
          </button>
        )}
      </For>
    </Show>
  );
}

function syncBox(box: HTMLElement) {
  let mount = mounts.get(box);
  const nativeTools = box.querySelector(':scope > .composer-tools');
  if (!nativeTools || !box.querySelector('textarea') || !box.isConnected) {
    if (mount) {
      mounts.delete(box);
      mount.dispose();
      mount.host.remove();
    }
    return;
  }
  if (!mount) {
    const host = document.createElement('div');
    host.className = 'yp-composer-tools';
    mount = { host, dispose: render(() => <Toolbar box={box} />, host) };
    mounts.set(box, mount);
  }
  if (nativeTools.nextElementSibling !== mount.host) nativeTools.after(mount.host);
}

function watch() {
  const style = appendStyle(css);
  for (const box of document.querySelectorAll<HTMLElement>('.composer-box')) syncBox(box);
  const observer = new MutationObserver((records) => {
    // Reconcile only affected composers; chat history can be a large, busy subtree.
    const boxes = new Set<HTMLElement>();
    for (const record of records) {
      if (record.target instanceof Element) {
        const owner = record.target.closest<HTMLElement>('.composer-box');
        if (owner) boxes.add(owner);
      }
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches('.composer-box')) boxes.add(node);
        for (const box of node.querySelectorAll<HTMLElement>('.composer-box')) boxes.add(box);
      }
    }
    for (const box of mounts.keys()) {
      if (!box.isConnected) boxes.add(box);
    }
    for (const box of boxes) syncBox(box);
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });
  return () => {
    observer.disconnect();
    for (const { host, dispose } of mounts.values()) {
      dispose();
      host.remove();
    }
    mounts.clear();
    style.remove();
  };
}

export function registerComposerTool(pluginId: string, tool: ComposerTool): () => void {
  if (
    typeof tool?.id !== 'string' ||
    !tool.id.trim() ||
    typeof tool.label !== 'string' ||
    !tool.label.trim() ||
    typeof tool.onActivate !== 'function' ||
    (typeof tool.icon !== 'function' && !isIconSource(tool.icon))
  ) {
    throw new TypeError('registerTool expects an ID, label, icon, and activation callback.');
  }
  const entry = { pluginId, tool: { ...tool } };
  setEntries((previous) => {
    const index = previous.findIndex(
      (item) => item.pluginId === pluginId && item.tool.id === tool.id,
    );
    return index < 0
      ? [...previous, entry]
      : previous.map((item, i) => (i === index ? entry : item));
  });
  stopWatching ??= watch();
  return () => {
    setEntries((previous) => previous.filter((item) => item !== entry));
    if (!entries().length) {
      stopWatching?.();
      stopWatching = undefined;
    }
  };
}
