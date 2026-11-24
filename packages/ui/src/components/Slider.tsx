import { createSignal, createUniqueId } from 'solid-js';
import type { SliderProps } from '@yapmod/types';

export function Slider(props: SliderProps) {
  const generatedId = createUniqueId();
  const id = () => props.id ?? generatedId;
  const [internal, setInternal] = createSignal(props.defaultValue ?? props.min ?? 0);
  const value = () => props.value ?? internal();
  const text = () => props.formatValue?.(value()) ?? String(value());

  return (
    <div class="field">
      <label for={id()}>{props.label}</label>
      <div class="dens-slider">
        <input
          id={id()}
          type="range"
          min={props.min ?? 0}
          max={props.max ?? 100}
          step={props.step ?? 1}
          value={value()}
          disabled={props.disabled}
          aria-valuetext={text()}
          onInput={(event) => {
            const next = event.currentTarget.valueAsNumber;
            if (props.value === undefined) setInternal(next);
            props.onChange?.(next);
          }}
        />
        <b>{text()}</b>
      </div>
    </div>
  );
}
