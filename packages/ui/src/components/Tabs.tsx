import { For, createUniqueId, type JSX } from 'solid-js';

export interface TabsProps<Value extends string> {
  label: string;
  value: Value;
  options: readonly { value: Value; label: string }[];
  disabled?: boolean;
  onChange: (value: Value) => void;
  children: JSX.Element;
}

export function Tabs<Value extends string>(props: TabsProps<Value>) {
  const id = createUniqueId();
  function navigate(event: KeyboardEvent & { currentTarget: HTMLDivElement }): void {
    if (props.disabled) return;
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = props.options.findIndex((option) => option.value === props.value);
    const tabList = event.currentTarget;
    const direction = globalThis.getComputedStyle(tabList).direction === 'rtl' ? -1 : 1;
    const step = (event.key === 'ArrowRight' ? 1 : -1) * direction;
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? props.options.length - 1
          : (current + step + props.options.length) % props.options.length;
    const option = props.options[index];
    if (!option) return;
    props.onChange(option.value);
    tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
  }

  return (
    <>
      <div class="dev-tabs yp-tabs" role="tablist" aria-label={props.label} onKeyDown={navigate}>
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
              disabled={props.disabled}
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
