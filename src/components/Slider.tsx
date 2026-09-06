import { forwardRef } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import clsx from "clsx";

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export const Slider = forwardRef<HTMLSpanElement, SliderProps>(function Slider(
  {
    value,
    defaultValue,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    disabled,
    className,
    "aria-label": ariaLabel,
  },
  ref,
) {
  return (
    <RadixSlider.Root
      ref={ref}
      className={clsx("rebar-slider", className)}
      data-rebar-component="slider"
      value={value !== undefined ? [value] : undefined}
      defaultValue={defaultValue !== undefined ? [defaultValue] : [min]}
      onValueChange={onValueChange ? (values) => onValueChange(values[0] ?? min) : undefined}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <RadixSlider.Track className="rebar-slider-track" data-rebar-part="track">
        <RadixSlider.Range className="rebar-slider-range" data-rebar-part="range" />
      </RadixSlider.Track>
      {/* aria-label belongs on the Thumb, not Root — the Thumb is the element that actually
          carries role="slider", and an ancestor's aria-label doesn't supply an accessible
          name to a descendant's own role. */}
      <RadixSlider.Thumb
        className="rebar-slider-thumb"
        data-rebar-part="thumb"
        aria-label={ariaLabel}
      />
    </RadixSlider.Root>
  );
});
