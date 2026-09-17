import { useEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import clsx from "clsx";

export type FloatingBubbleAxis = "x" | "y" | "xy" | "lock";

export interface FloatingBubbleOffset {
  x: number;
  y: number;
}

export interface FloatingBubbleProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  children?: ReactNode;
  /** Which direction dragging is allowed in. `"lock"` picks whichever axis the drag started
   * closest to and holds it for the rest of that gesture. Default `"y"`. */
  axis?: FloatingBubbleAxis;
  /** Snaps the bubble to the nearest edge of its offset parent on release, along the given
   * axis/axes. Off by default. */
  magnetic?: "x" | "y" | "xy";
  defaultOffset?: FloatingBubbleOffset;
  offset?: FloatingBubbleOffset;
  onOffsetChange?: (offset: FloatingBubbleOffset) => void;
  className?: string;
}

const DRAG_THRESHOLD_PX = 5;

/**
 * A single clickable bubble the user can drag anywhere on screen — antd-mobile's `FloatingBubble`.
 * Distinct from `SpeedDial` (a fixed-position expandable menu of several actions): this is one
 * button, its whole point is that its *position* is adjustable, optionally snapping magnetically
 * to the nearest screen edge once released. Position it with normal CSS (`position: fixed`,
 * `bottom`/`right`, etc., via `style`/`className`) — the drag offset layers on top as a
 * `transform: translate()`, never replacing your own base position.
 *
 * Dragging is purely positional, never the only way to use the bubble (heuristic #38): it's a
 * real `<button>`, so Enter/Space activates `onClick` regardless of whether it's ever been
 * dragged, and a real click vs. a drag are told apart by total pointer movement, not just
 * pointerup timing.
 */
export function FloatingBubble({
  children,
  axis = "y",
  magnetic,
  defaultOffset = { x: 0, y: 0 },
  offset,
  onOffsetChange,
  onClick,
  className,
  style,
  ...props
}: FloatingBubbleProps) {
  const [internalOffset, setInternalOffset] = useState(defaultOffset);
  const isControlled = offset !== undefined;
  const current = isControlled ? offset : internalOffset;

  const setOffset = (next: FloatingBubbleOffset) => {
    if (!isControlled) setInternalOffset(next);
    onOffsetChange?.(next);
  };

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: FloatingBubbleOffset;
    lockedAxis: "x" | "y" | null;
    moved: boolean;
  } | null>(null);
  // Read fresh inside the pointer-listener effect below without needing `current` in its
  // dependency array — that would tear down and re-attach the window listeners on every single
  // pointermove-driven offset update, mid-drag, which is both wasteful and unnecessary.
  const currentRef = useRef(current);
  currentRef.current = current;
  // `handleUp` (a native window listener) always runs and clears `dragRef.current` before the
  // browser's own follow-up `click` event reaches this button's React `onClick` — so `handleClick`
  // can't read `dragRef.current.moved` directly, it would always see it already nulled out. This
  // is what actually survives from one pointer session into the click that (may) follow it.
  const justDraggedRef = useRef(false);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    justDraggedRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: current,
      lockedAxis: null,
      moved: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A real browser can reject capture for a pointer it doesn't consider active — harmless,
      // dragging still works via the move/up listeners below.
    }
  };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        drag.moved = true;
      }

      let effectiveAxis: "x" | "y" | "xy" = axis === "lock" ? drag.lockedAxis ?? "x" : (axis as "x" | "y" | "xy");
      if (axis === "lock" && !drag.lockedAxis && drag.moved) {
        drag.lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        effectiveAxis = drag.lockedAxis;
      }

      const nextX = effectiveAxis === "y" ? drag.startOffset.x : drag.startOffset.x + dx;
      const nextY = effectiveAxis === "x" ? drag.startOffset.y : drag.startOffset.y + dy;
      setOffset({ x: nextX, y: nextY });
    };

    const handleUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      if (magnetic && drag.moved) {
        const parent = button.offsetParent as HTMLElement | null;
        const bounds = (parent ?? document.documentElement).getBoundingClientRect();
        const rect = button.getBoundingClientRect();
        let { x, y } = currentRef.current;
        if (magnetic === "x" || magnetic === "xy") {
          const distanceToLeft = rect.left - bounds.left;
          const distanceToRight = bounds.right - rect.right;
          x += distanceToLeft <= distanceToRight ? -distanceToLeft : distanceToRight;
        }
        if (magnetic === "y" || magnetic === "xy") {
          const distanceToTop = rect.top - bounds.top;
          const distanceToBottom = bounds.bottom - rect.bottom;
          y += distanceToTop <= distanceToBottom ? -distanceToTop : distanceToBottom;
        }
        setOffset({ x, y });
      }

      justDraggedRef.current = drag.moved;
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // `setOffset`/`onOffsetChange` intentionally excluded — re-created every render (they close
    // over `isControlled`/`onOffsetChange` themselves), and including them would cause the same
    // needless per-drag-frame listener churn `currentRef` above exists to avoid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis, magnetic]);

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={clsx("rebar-floating-bubble", className)}
      data-rebar-component="floating-bubble"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      style={{ transform: `translate(${current.x}px, ${current.y}px)`, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
