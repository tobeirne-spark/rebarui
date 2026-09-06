import { useState } from "react";
import clsx from "clsx";
import { Popover } from "./Popover";

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Swatches shown in the popover — a native color input is always offered alongside them for
   * anything not in this set. */
  presets?: string[];
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_PRESETS = [
  "#0066cc",
  "#2e7d32",
  "#d32f2f",
  "#f57c00",
  "#7b1fa2",
  "#00838f",
  "#212121",
  "#757575",
];

/**
 * A color swatch that opens a popover of preset swatches plus a native `<input type="color">` for
 * anything else — the native picker is the browser's own accessible, cross-platform color UI, not
 * reimplemented here; this component is the trigger, the preset grid, and the value it settles on.
 */
export function ColorPicker({
  value,
  defaultValue = DEFAULT_PRESETS[0]!,
  onChange,
  presets = DEFAULT_PRESETS,
  "aria-label": ariaLabel = "Pick a color",
  disabled,
  className,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const setColor = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={clsx("rebar-color-picker-trigger", className)}
          data-rebar-component="color-picker"
          aria-label={`${ariaLabel}, current color ${current}`}
          disabled={disabled}
          style={{ backgroundColor: current }}
        />
      }
    >
      <div className="rebar-color-picker-grid" data-rebar-part="presets">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className="rebar-color-picker-swatch"
            data-rebar-active={preset === current || undefined}
            aria-label={preset}
            style={{ backgroundColor: preset }}
            onClick={() => {
              setColor(preset);
              setOpen(false);
            }}
          />
        ))}
      </div>
      <input
        type="color"
        className="rebar-color-picker-native"
        aria-label="Custom color"
        value={current}
        onChange={(e) => setColor(e.target.value)}
      />
    </Popover>
  );
}
