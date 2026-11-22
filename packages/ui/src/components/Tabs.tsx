import { For, createUniqueId } from 'solid-js';

import type { TabsProps } from '@yapmod/types';
export type { TabsProps } from '@yapmod/types';

export function Tabs<Value extends string>(props: TabsProps<Value>) {
  const id = createUniqueId();
  function navigate(event: KeyboardEvent & { currentTarget: HTMLDivElement }): void {
    if (props.disabled) return;
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const options = props.options.filter((option) => !option.disabled);
    if (!options.length) return;
    const current = options.findIndex((option) => option.value === props.value);
    const tabList = event.currentTarget;
    const direction = globalThis.getComputedStyle(tabList).direction === 'rtl' ? -1 : 1;
    const step = (event.key === 'ArrowRight' ? 1 : -1) * direction;
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : (current + step + options.length) % options.length;
    const option = options[index];
    if (!option) return;
    props.onChange(option.value);
    tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')[index]?.focus();
  }

  return (
    <>
      <div
        class="yp-tabs"
        classList={{ 'yp-tabs--pills': props.variant === 'pills' }}
        role="tablist"
        aria-label={props.label}
        onKeyDown={navigate}
      >
        <For each={props.options}>
          {(option) => (
            <button
              type="button"
              role="tab"
              id={`${id}-${option.value}`}
              classList={{ on: props.value === option.value }}
              aria-selected={props.value === option.value}
              aria-controls={`${id}-panel`}
              tabIndex={props.value === option.value ? 0 : -1}
              disabled={props.disabled || option.disabled}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </button>
          )}
        </For>
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${props.value}`} tabIndex={0}>
        {props.children}
      </div>
    </>
  );
}
