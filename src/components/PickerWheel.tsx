import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent } from "react";
import clsx from "clsx";

export interface PickerWheelProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value" | "defaultValue" | "onChange"> {
  options: string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** How many rows are visible at once. Must be odd so one sits exactly centered. Default `5`. */
  visibleCount?: number;
  /**
   * Visual + real row height in px. Default `44` — a deliberate departure from a purely visual
   * "wheel" row height (which iOS-style pickers often draw thinner, ~36px): every row here is a
   * real `<button>`, and ref/HEURISTICS.md #19 requires a genuine ≥44px touch target, padding
   * included if the visual element is smaller. Rather than reaching for `ResizablePanels`' "thin
   * visual line, padded-out real hit area" trick — which works there because the divider sits
   * alone with empty space around it — stacked, edge-to-edge picker rows would just push that
   * extra hit area onto the *neighboring* row, so the honest fix is sizing the row itself at 44px.
   */
  itemHeight?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * A single-column "wheel" value selector — one option centered in a fixed viewport, drag or
 * mouse-wheel to spin the list, snapping the nearest option to center on release/settle. Distinct
 * from `Calendar`'s grid or `TimePicker`'s scrollable button-list: this is the iOS `UIPickerView`
 * interaction specifically.
 *
 * Controlled/uncontrolled via `value`/`defaultValue`/`onValueChange`, the same pattern every other
 * stateful component in this library follows.
 *
 * Three independent, genuinely real input paths, per ref/HEURISTICS.md #27 and #38 (a drag needs a
 * non-drag fallback): plain `pointerdown`/`pointermove`/`pointerup` dragging (no new dependency,
 * same technique as `ResizablePanels`), a real `onWheel` listener, and — the actual non-drag
 * fallback — every option is its own always-clickable real `<button>`; clicking one not currently
 * centered scrolls it to center and selects it, same as a real click on any other control.
 */
export function PickerWheel({
  options,
  value,
  defaultValue,
  onValueChange,
  visibleCount = 5,
  itemHeight = 44,
  className,
  "aria-label": ariaLabel = "Picker",
  ...props
}: PickerWheelProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]);
  const isControlled = value !== undefined;
  const current = (isControlled ? value : internalValue) ?? options[0] ?? "";
  const selectedIndex = clamp(options.indexOf(current), 0, Math.max(options.length - 1, 0));

  const setValue = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const centerOffset = Math.floor(visibleCount / 2) * itemHeight;
  const translateForIndex = (index: number) => centerOffset - index * itemHeight;

  const [liveTranslate, setLiveTranslate] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggedRef = useRef(false);
  const startClientYRef = useRef(0);
  const startIndexRef = useRef(0);

  const committedTranslate = translateForIndex(selectedIndex);
  const displayTranslate = liveTranslate ?? committedTranslate;

  const selectIndex = (index: number) => {
    const clamped = clamp(index, 0, options.length - 1);
    const next = options[clamped];
    if (next !== undefined && next !== current) setValue(next);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (options.length === 0) return;
    draggedRef.current = false;
    startClientYRef.current = e.clientY;
    startIndexRef.current = selectedIndex;
    setIsDragging(true);
    setLiveTranslate(translateForIndex(selectedIndex));

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startClientYRef.current;
      if (Math.abs(delta) > 4) draggedRef.current = true;
      setLiveTranslate(translateForIndex(startIndexRef.current) + delta);
    };
    const handleUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const delta = upEvent.clientY - startClientYRef.current;
      const rawIndex = startIndexRef.current - delta / itemHeight;
      setIsDragging(false);
      setLiveTranslate(null);
      selectIndex(Math.round(rawIndex));
      // A released drag can still fire a trailing `click` on whichever option ends up under the
      // pointer — same conflict `Kanban`'s own `dragOccurredRef` resolves for its sticky variant.
      // Clear the flag just after this tick so a genuine subsequent tap still works normally.
      setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (options.length === 0) return;
    e.preventDefault();
    selectIndex(selectedIndex + (e.deltaY > 0 ? 1 : -1));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectIndex(selectedIndex - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectIndex(selectedIndex + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      selectIndex(options.length - 1);
    }
  };

  return (
    <div
      className={clsx("rebar-picker-wheel", className)}
      data-rebar-component="picker-wheel"
      style={{ height: visibleCount * itemHeight }}
      {...props}
    >
      <div
        className="rebar-picker-wheel-highlight"
        data-rebar-part="highlight"
        aria-hidden="true"
        style={{ height: itemHeight, top: centerOffset }}
      />
      <div
        className="rebar-picker-wheel-track"
        data-rebar-part="track"
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        style={{
          transform: `translateY(${displayTranslate}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease",
        }}
      >
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selected}
              className="rebar-picker-wheel-option"
              data-rebar-part="option"
              data-rebar-selected={selected || undefined}
              style={{ height: itemHeight }}
              tabIndex={-1}
              onClick={() => {
                if (draggedRef.current) return;
                selectIndex(index);
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
