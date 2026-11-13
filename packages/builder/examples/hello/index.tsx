// oxlint-disable-next-line unicorn/require-module-specifiers -- an empty type import is exactly the point: it loads the ambient `yapmod` declaration.
import type {} from '@yapmod/builder/global';
import { createSignal } from 'solid-js';

/*
 * The sample plugin built by `pnpm --filter @yapmod/builder example`.
 *
 * `yapmod` comes from @yapmod/builder/global, and the `solid-js` import is
 * rewritten to the host's shared instance at build time, so the bundle never
 * carries a second copy of Solid. Nothing here cleans up manually: observe()
 * and settings.registerSection() return disposers that the runtime flushes
 * when the plugin stops, so there is no onUnload hook.
 */

export default {
  onLoad() {
    const { log, observe, settings, storage, ui } = yapmod;

    storage.visits = Number(storage.visits ?? 0) + 1;
    log(`hello loaded (visit #${String(storage.visits)})`);

    observe('body', () => log('found the page body'));

    settings.registerSection({
      id: 'hello',
      label: 'Hello',
      icon: 'pencil',
      render() {
        const [name, setName] = createSignal(String(storage.name ?? 'world'));
        return (
          <ui.Panel>
            <p>Hello, {name()}!</p>
            <ui.Hint>Stored visits: {String(storage.visits)}</ui.Hint>
            <input value={name()} onInput={(event) => setName(event.currentTarget.value)} />
            <ui.Button
              onClick={() => {
                // A top-level storage set persists automatically.
                storage.name = name();
                ui.showToast('Saved.');
              }}
            >
              Save
            </ui.Button>
          </ui.Panel>
        );
      },
    });
  },
};
