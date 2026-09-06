import { useCallback, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";

export interface ResizablePanelsProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Stack panels top/bottom instead of side by side. Default `"horizontal"`. */
  direction?: "horizontal" | "vertical";
  /** The first panel's initial share of the total space, 0-1. Default `0.5`. */
  defaultSplit?: number;
  /** Controlled split (0-1) — the first panel's current share of the total space. */
  split?: number;
  onSplitChange?: (split: number) => void;
  /** Smallest share the first panel can be resized down to, 0-1. Default `0.1`. */
  minSplit?: number;
  /** Largest share the first panel can be resized up to, 0-1. Default `0.9`. */
  maxSplit?: number;
  first: ReactNode;
  second: ReactNode;
  className?: string;
}

const KEYBOARD_STEP = 0.02;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Two panels side by side (or stacked, via `direction="vertical"`) separated by a draggable
 * divider. Uncontrolled/controlled via `split`/`defaultSplit`/`onSplitChange`, the same pattern
 * every other stateful component in this library follows.
 *
 * The divider drag is implemented with plain `pointerdown`/`pointermove`/`pointerup` listeners
 * (no new dependency) rather than a Radix primitive, since Radix has no resizable-panels
 * primitive — but it still gets a real `role="separator"` plus full keyboard support
 * (ArrowLeft/ArrowRight when horizontal, ArrowUp/ArrowDown when vertical), since a pointer-only
 * resize control with no keyboard equivalent would violate this project's own accessibility bar
 * (see ref/HEURISTICS.md #38, #48 — every drag interaction needs a real non-drag fallback).
 */
export function ResizablePanels({
  direction = "horizontal",
  defaultSplit = 0.5,
  split,
  onSplitChange,
  minSplit = 0.1,
  maxSplit = 0.9,
  first,
  second,
  className,
  ...props
}: ResizablePanelsProps) {
  const isControlled = split !== undefined;
  const [internalSplit, setInternalSplit] = useState(() => clamp(defaultSplit, minSplit, maxSplit));
  const current = clamp(isControlled ? split : internalSplit, minSplit, maxSplit);

  const setSplit = useCallback(
    (next: number) => {
      const clamped = clamp(next, minSplit, maxSplit);
      if (!isControlled) setInternalSplit(clamped);
      onSplitChange?.(clamped);
    },
    [isControlled, minSplit, maxSplit, onSplitChange],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const horizontal = direction === "horizontal";

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = horizontal
        ? (clientX - rect.left) / rect.width
        : (clientY - rect.top) / rect.height;
      setSplit(ratio);
    },
    [horizontal, setSplit],
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    draggingRef.current = true;
    updateFromPointer(e.clientX, e.clientY);

    const handleMove = (moveEvent: PointerEvent) => {
      if (!draggingRef.current) return;
      updateFromPointer(moveEvent.clientX, moveEvent.clientY);
    };
    const handleUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const decreaseKey = horizontal ? "ArrowLeft" : "ArrowUp";
    const increaseKey = horizontal ? "ArrowRight" : "ArrowDown";
    if (e.key === decreaseKey) {
      e.preventDefault();
      setSplit(current - KEYBOARD_STEP);
    } else if (e.key === increaseKey) {
      e.preventDefault();
      setSplit(current + KEYBOARD_STEP);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSplit(minSplit);
    } else if (e.key === "End") {
      e.preventDefault();
      setSplit(maxSplit);
    }
  };

  const firstStyle = horizontal ? { width: `${current * 100}%` } : { height: `${current * 100}%` };
  const secondStyle = horizontal
    ? { width: `${(1 - current) * 100}%` }
    : { height: `${(1 - current) * 100}%` };

  return (
    <div
      ref={containerRef}
      className={clsx("rebar-resizable-panels", `rebar-resizable-panels-${direction}`, className)}
      data-rebar-component="resizable-panels"
      {...props}
    >
      <div className="rebar-resizable-panels-panel" data-rebar-part="first-panel" style={firstStyle}>
        {first}
      </div>
      <div
        className="rebar-resizable-panels-divider"
        data-rebar-part="divider"
        role="separator"
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(current * 100)}
        aria-valuemin={Math.round(minSplit * 100)}
        aria-valuemax={Math.round(maxSplit * 100)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <div className="rebar-resizable-panels-divider-line" data-rebar-part="divider-line" />
      </div>
      <div className="rebar-resizable-panels-panel" data-rebar-part="second-panel" style={secondStyle}>
        {second}
      </div>
    </div>
  );
}
