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
  /** Visual size of the swatch itself — matches `Button`'s own `size` naming. The trigger's real
   * clickable footprint always stays a genuine ≥44×44px target regardless (padding included when
   * the visual swatch is smaller — see ref/HEURISTICS.md #19), the same "thin visual element,
   * padded-out real hit area" trick `ResizablePanels`' divider already uses. Default `"md"`. */
  size?: "sm" | "md" | "lg";
  /** `"full"` (default): every color in `presets`. `"recent"`: only the 3 most-recently-picked
   * colors (a real functional reduction, not just a smaller version of the same grid) — for a
   * compact "just show me what I already used" picker, seeded with the first few `presets` before
   * anything's actually been picked yet. The native color input is still offered in both modes for
   * anything not in the shown set. */
  mode?: "recent" | "full";
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

const SWATCH_SIZE_PX: Record<NonNullable<ColorPickerProps["size"]>, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

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

const RECENT_LIMIT = 3;

// Moves `color` to the front of `recent` (deduped), capped at RECENT_LIMIT — the shared update
// used both to seed an initial "recent" list from `presets` and to record each real pick.
function pushRecent(recent: string[], color: string): string[] {
  return [color, ...recent.filter((c) => c !== color)].slice(0, RECENT_LIMIT);
}

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
  size = "md",
  mode = "full",
  "aria-label": ariaLabel = "Pick a color",
  disabled,
  className,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // Seeded from `presets` alone (not `defaultValue`) — a caller's `defaultValue` need not itself
  // be one of `presets` (it defaults to `DEFAULT_PRESETS[0]`, unrelated to a caller-supplied custom
  // `presets` array), and forcing it into the initial "recent" list would silently push out one of
  // the caller's own intended starting colors.
  const [recentColors, setRecentColors] = useState<string[]>(() => presets.slice(0, RECENT_LIMIT));
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;

  const setColor = (next: string) => {
    if (!isControlled) setInternalValue(next);
    setRecentColors((prev) => pushRecent(prev, next));
    onChange?.(next);
  };

  const shownSwatches = mode === "recent" ? recentColors : presets;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={clsx("rebar-color-picker-trigger", className)}
          data-rebar-component="color-picker"
          data-rebar-size={size}
          aria-label={`${ariaLabel}, current color ${current}`}
          disabled={disabled}
        >
          <span
            className="rebar-color-picker-trigger-swatch"
            data-rebar-part="swatch"
            aria-hidden="true"
            style={{ backgroundColor: current, width: SWATCH_SIZE_PX[size], height: SWATCH_SIZE_PX[size] }}
          />
        </button>
      }
    >
      <div className="rebar-color-picker-grid" data-rebar-part="presets">
        {shownSwatches.map((preset) => (
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
