import { For, Show, createEffect, createMemo, createSignal, onCleanup, splitProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { JSX } from 'solid-js';
import { cx } from '../cx';

/** One entry of a {@link Select}. */
export interface SelectOption {
  /** The value reported by `onChange`. */
  value: string;
  /** The text shown in the trigger and in the option list. */
  label: string;
  /** Disabled options are dimmed and cannot be picked. */
  disabled?: boolean;
}

export type SelectProps = {
  /** The options to offer, in display order. */
  options: readonly SelectOption[];
  /** The selected value. Makes the select controlled. */
  value?: string;
  /** The initially selected value of an uncontrolled select. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onChange?: (value: string) => void;
  /** Text shown while nothing is selected. */
  placeholder?: string;
  /** Disables the whole control. */
  disabled?: boolean;
  /** Id of the trigger button. */
  id?: string;
  /** Name of the hidden input that carries the selected value. */
  name?: string;
  /** Marks the control as required for form validation. */
  required?: boolean;
  /** Extra class on the trigger. */
  class?: string;
  /** Extra classes on the trigger. */
  classList?: Record<string, boolean | undefined>;
  /** Accessible name of the control. */
  'aria-label'?: string;
  /** Id of the element labelling the control. */
  'aria-labelledby'?: string;
};

let uid = 0;

/** The chevron Yapin puts at the right of a dropdown trigger. */
const CHEVRON =
  'M5.3 9.3a1 1 0 0 1 1.4 0L12 14.6l5.3-5.3a1 1 0 1 1 1.4 1.4l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4Z';

/**
 * A dropdown styled by Yapmod's stylesheet to match Yapin's `.dd-trigger` and
 * `.dd-menu`.
 *
 * The trigger is a button with `role="combobox"`; the option list is a
 * `listbox` that the trigger points at with `aria-activedescendant`, so the
 * keyboard interaction matches Yapin's own dropdown: arrow keys move the
 * highlight, Enter picks the highlighted option and Escape closes the list.
 *
 * The select is controlled when `value` is given and uncontrolled otherwise.
 */
export function Select(props: SelectProps) {
  const [local] = splitProps(props, [
    'options',
    'value',
    'defaultValue',
    'onChange',
    'placeholder',
    'disabled',
    'id',
    'name',
    'required',
    'class',
    'classList',
    'aria-label',
    'aria-labelledby',
  ]);

  const listId = `yp-dd-list-${(uid += 1)}`;
  const optionId = (index: number) => `${listId}-${index}`;

  const [internal, setInternal] = createSignal(local.defaultValue ?? '');
  const isControlled = () => local.value !== undefined;
  const selected = () => (isControlled() ? (local.value ?? '') : internal());

  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(-1);

  let trigger: HTMLButtonElement | undefined;
  let menu: HTMLDivElement | undefined;
  const selectedIndex = createMemo(() =>
    local.options.findIndex((option) => option.value === selected()),
  );
  const selectedLabel = createMemo(() => local.options[selectedIndex()]?.label);
  const hasValue = () => selectedIndex() >= 0;

  const isDisabled = (index: number) => local.options[index]?.disabled === true;

  const move = (step: number) => {
    const count = local.options.length;
    if (count === 0) return;
    let index = active();
    for (let step2 = 0; step2 < count; step2 += 1) {
      index = (index + step + count) % count;
      if (!isDisabled(index)) {
        setActive(index);
        return;
      }
    }
  };

  const moveTo = (index: number) => {
    if (index >= 0 && index < local.options.length && !isDisabled(index)) setActive(index);
  };

  const commit = (index: number) => {
    const option = local.options[index];
    if (!option || option.disabled) return;
    if (!isControlled()) setInternal(option.value);
    local.onChange?.(option.value);
    setOpen(false);
  };

  const openMenu = () => {
    if (local.disabled || open()) return;
    setActive(hasValue() ? selectedIndex() : -1);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const toggleMenu = () => {
    if (local.disabled) return;
    if (open()) closeMenu();
    else openMenu();
  };

  /* ------------------------------------------------------------ placement -- */

  const [placement, setPlacement] = createSignal({ left: 0, top: 0, width: 0 });

  /**
   * Places the menu under the trigger, flipping it above when there is not
   * enough room below. Yapin positions the menu with `position: fixed`, so
   * the same is done here.
   */
  const place = () => {
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const width = rect.width;
    const maxHeight = 280;
    const height = Math.min(menu.offsetHeight, maxHeight);
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;

    const top =
      height > below && above > below ? Math.max(8, rect.top - height - 4) : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

    setPlacement({ left, top, width });
  };

  createEffect(() => {
    if (!open()) return;

    // First pass: put the menu under the trigger so it can be measured.
    const rect = trigger?.getBoundingClientRect();
    if (rect) setPlacement({ left: rect.left, top: rect.bottom + 4, width: rect.width });

    const frame = requestAnimationFrame(place);
    const onViewportChange = () => place();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && (menu?.contains(target) || trigger?.contains(target))) return;
      closeMenu();
    };
    document.addEventListener('mousedown', onPointerDown, true);

    onCleanup(() => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      document.removeEventListener('mousedown', onPointerDown, true);
    });
  });

  /* ------------------------------------------------------------- keyboard -- */

  const handleKeyDown: JSX.EventHandlerUnion<HTMLButtonElement, KeyboardEvent> = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open()) openMenu();
        else move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open()) openMenu();
        else move(-1);
        break;
      case 'Home':
        if (!open()) return;
        event.preventDefault();
        moveTo(0);
        break;
      case 'End': {
        if (!open()) return;
        event.preventDefault();
        moveTo(local.options.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        if (!open()) return;
        event.preventDefault();
        commit(active());
        break;
      }
      case 'Escape':
        if (!open()) return;
        event.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        closeMenu();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <button
        ref={(element) => {
          trigger = element;
        }}
        type="button"
        id={local.id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={listId}
        aria-required={local.required}
        aria-label={local['aria-label']}
        aria-labelledby={local['aria-labelledby']}
        disabled={local.disabled}
        class={cx(
          'yp-input',
          'yp-dd-trigger',
          open() && 'yp-dd-trigger--open',
          local.class,
          local.classList,
        )}
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
      >
        <span class={cx('yp-dd-value', !hasValue() && 'yp-dd-value--empty')}>
          {selectedLabel() ?? local.placeholder ?? ''}
        </span>
        <svg class="yp-dd-chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d={CHEVRON} />
        </svg>
      </button>

      <Show when={local.name}>
        <input type="hidden" name={local.name} value={selected()} />
      </Show>

      <Show when={open()}>
        <Portal>
          <div
            ref={(element) => {
              menu = element;
            }}
            class="yp-dd-menu"
            style={{
              left: `${placement().left}px`,
              top: `${placement().top}px`,
              width: `${placement().width}px`,
              'max-height': '280px',
            }}
          >
            <div
              class="yp-dd-list"
              role="listbox"
              id={listId}
              aria-activedescendant={active() >= 0 ? optionId(active()) : undefined}
            >
              <For each={local.options}>
                {(option, index) => (
                  <div
                    id={optionId(index())}
                    role="option"
                    aria-selected={option.value === selected()}
                    aria-disabled={option.disabled === true}
                    class={cx(
                      'yp-dd-opt',
                      option.value === selected() && 'yp-dd-opt--on',
                      index() === active() && 'yp-dd-opt--hi',
                      option.disabled && 'yp-dd-opt--off',
                    )}
                    onMouseEnter={() => !option.disabled && setActive(index())}
                    onClick={() => commit(index())}
                  >
                    <span class="yp-dd-label">{option.label}</span>
                    <Show when={option.value === selected()}>
                      <svg
                        class="yp-dd-check"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                        <path
                          d="m8 12.5 2.6 2.6L16.2 9.4"
                          fill="none"
                          stroke="#fff"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
}
