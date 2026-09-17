import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";

export interface FloatingPanelProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onScroll" | "aria-label"> {
  /** Heights (px) the panel can be dragged to and snaps between on release. */
  anchors: number[];
  /** Which screen edge the panel is pinned to and grows away from. Default `"bottom"`. */
  placement?: "bottom" | "top";
  defaultHeight?: number;
  height?: number;
  onHeightChange?: (height: number, animating: boolean) => void;
  /** Whether dragging inside the content area (not just the header/handle) can also move the
   * panel — only when the content is already scrolled to its start edge and the drag continues
   * further in the "collapse" direction, so it never fights a normal scroll. Default `true`. */
  handleDraggingOfContent?: boolean;
  /** Extra content in the drag handle row, above the main content — e.g. a title. */
  header?: ReactNode;
  /** Accessible name for the drag handle (a real, keyboard-operable `role="slider"` — Arrow
   * keys/Home/End jump between anchors, so height is never adjustable by drag alone). Default
   * `"Resize panel"`. */
  "aria-label"?: string;
  children?: ReactNode;
  className?: string;
}

export interface FloatingPanelRef {
  setHeight: (height: number, options?: { immediate?: boolean }) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearestAnchor(anchors: number[], value: number): number {
  return anchors.reduce((closest, anchor) => (Math.abs(anchor - value) < Math.abs(closest - value) ? anchor : closest));
}

/**
 * A bottom (or top) sheet the user drags freely between a fixed set of `anchors` heights, snapping
 * to the nearest one on release — antd-mobile's `FloatingPanel`, e.g. a map's destination-details
 * panel. Distinct from `BottomSheet` (open/closed only, dismissed via drag-past-threshold, close
 * button, Esc, or backdrop): this has no backdrop and no "closed" state at all, it's always
 * showing at one of its anchor heights, and dragging moves between them rather than dismissing
 * anything.
 */
export const FloatingPanel = forwardRef<FloatingPanelRef, FloatingPanelProps>(function FloatingPanel(
  {
    anchors,
    placement = "bottom",
    defaultHeight,
    height,
    onHeightChange,
    handleDraggingOfContent = true,
    header,
    "aria-label": ariaLabel = "Resize panel",
    children,
    className,
    style,
    ...rest
  },
  ref,
) {
  const sortedAnchors = [...anchors].sort((a, b) => a - b);
  const minHeight = sortedAnchors[0] ?? 0;
  const maxHeight = sortedAnchors[sortedAnchors.length - 1] ?? 0;

  const [internalHeight, setInternalHeight] = useState(defaultHeight ?? minHeight);
  const isControlled = height !== undefined;
  const current = isControlled ? height : internalHeight;

  const setHeightValue = (next: number, animating: boolean) => {
    if (!isControlled) setInternalHeight(next);
    onHeightChange?.(next, animating);
  };
  // Read fresh from inside the pointermove/pointerup effect below, which only re-attaches its
  // window listeners when `placement`/anchors change — not on every `onHeightChange` identity
  // change — so a stale closure over `isControlled`/`onHeightChange` doesn't linger there.
  const setHeightValueRef = useRef(setHeightValue);
  setHeightValueRef.current = setHeightValue;

  const [dragging, setDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    isContentDrag: boolean;
    /** For a content drag, only flips true once a move is confirmed to be a real panel-collapse
     * gesture (content at its start edge, moving further in the collapse direction) — a plain
     * pointerdown before any move happens is not yet known to be a panel drag at all, and
     * shouldn't disable the height transition or mark `data-rebar-dragging` prematurely. Always
     * true immediately for a handle drag, which is unambiguous from pointerdown. */
    active: boolean;
  } | null>(null);

  const handleHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: currentRef.current,
      isContentDrag: false,
      active: true,
    };
    setDragging(true);
  };

  const handleContentPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!handleDraggingOfContent) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: currentRef.current,
      isContentDrag: true,
      active: false,
    };
  };

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const rawDelta = event.clientY - drag.startY;
      const heightDelta = placement === "bottom" ? -rawDelta : rawDelta;

      if (drag.isContentDrag && !drag.active) {
        const content = contentRef.current;
        const atStart = !content || content.scrollTop <= 0;
        const collapsing = heightDelta < 0;
        if (!atStart || !collapsing) return; // let the browser scroll the content normally
        drag.active = true;
        setDragging(true);
      }
      if (drag.isContentDrag) event.preventDefault();

      const next = clamp(drag.startHeight + heightDelta, minHeight, maxHeight);
      setHeightValueRef.current(next, true);
    };

    const handleUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (!drag.active) return; // never became a real panel drag — nothing to snap
      setDragging(false);
      const snapped = nearestAnchor(sortedAnchors, currentRef.current);
      setHeightValueRef.current(snapped, true);
      window.setTimeout(() => setHeightValueRef.current(snapped, false), 200);
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, minHeight, maxHeight, sortedAnchors.join(",")]);

  // No deps array: this recreates the imperative handle every render, which is the safe choice
  // here rather than risking a stale `setHeightValue` closure (it captures `isControlled` and
  // the caller's own `onHeightChange`, both of which a partial deps list could miss a change to).
  useImperativeHandle(ref, () => ({
    setHeight: (next, options) => {
      const clamped = clamp(next, minHeight, maxHeight);
      setHeightValue(clamped, !options?.immediate);
      if (!options?.immediate) {
        window.setTimeout(() => setHeightValue(clamped, false), 200);
      }
    },
  }));

  const jumpToAnchor = (target: number) => {
    setHeightValue(target, true);
    window.setTimeout(() => setHeightValue(target, false), 200);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const larger = sortedAnchors.filter((anchor) => anchor > currentRef.current);
    const smaller = sortedAnchors.filter((anchor) => anchor < currentRef.current);
    const growKey = placement === "bottom" ? "ArrowUp" : "ArrowDown";
    const shrinkKey = placement === "bottom" ? "ArrowDown" : "ArrowUp";

    if (event.key === growKey && larger.length > 0) {
      event.preventDefault();
      jumpToAnchor(Math.min(...larger));
    } else if (event.key === shrinkKey && smaller.length > 0) {
      event.preventDefault();
      jumpToAnchor(Math.max(...smaller));
    } else if (event.key === "Home") {
      event.preventDefault();
      jumpToAnchor(minHeight);
    } else if (event.key === "End") {
      event.preventDefault();
      jumpToAnchor(maxHeight);
    }
  };

  const edgeStyle = placement === "bottom" ? { bottom: 0 } : { top: 0 };

  return (
    <div
      className={clsx("rebar-floating-panel", `rebar-floating-panel-${placement}`, className)}
      data-rebar-component="floating-panel"
      data-rebar-dragging={dragging}
      style={{ height: current, transition: dragging ? "none" : "height 0.2s ease", ...edgeStyle, ...style }}
      {...rest}
    >
      <div
        className="rebar-floating-panel-handle"
        data-rebar-part="handle"
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-orientation="vertical"
        aria-valuenow={current}
        aria-valuemin={minHeight}
        aria-valuemax={maxHeight}
        onPointerDown={handleHandlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <div className="rebar-floating-panel-bar" aria-hidden="true" />
        {header}
      </div>
      <div
        ref={contentRef}
        className="rebar-floating-panel-content"
        data-rebar-part="content"
        onPointerDown={handleContentPointerDown}
      >
        {children}
      </div>
    </div>
  );
});
