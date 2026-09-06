import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import clsx from "clsx";
import { Spin } from "./Spin";

export interface PullToRefreshProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  onRefresh: () => void | Promise<void>;
  /** Pixels the content must be pulled down before release triggers a refresh. Default `60`. */
  threshold?: number;
  /**
   * Controlled refreshing state. Omit to let the component manage its own internal spinner state
   * around the `onRefresh` call (awaiting it, whether or not it actually returns a `Promise`).
   */
  refreshing?: boolean;
  children: ReactNode;
}

/**
 * Wraps scrollable content with a pull-down-to-refresh gesture, plain `pointerdown`/`pointermove`/
 * `pointerup` (no new dependency), the same technique `ResizablePanels` uses for its divider drag.
 *
 * The pull gesture only starts tracking when the scroll container is genuinely at `scrollTop === 0`
 * at the moment the drag begins — checked against the real DOM node, not assumed — so a pull-down
 * on already-scrolled content just scrolls normally instead of hijacking the gesture.
 *
 * Heuristic #38 (drag-and-drop needs a non-drag fallback): a touch-only pull gesture with no other
 * trigger would be undiscoverable and inaccessible to a mouse/keyboard user, so a small, always-
 * visible "Refresh" real `<button>` sits in the corner regardless of pull state — the genuine
 * non-gesture path in, not a hover- or touch-only affordance.
 */
export function PullToRefresh({
  onRefresh,
  threshold = 60,
  refreshing,
  children,
  className,
  ...props
}: PullToRefreshProps) {
  const isControlled = refreshing !== undefined;
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const currentRefreshing = isControlled ? refreshing : internalRefreshing;

  const scrollRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const triggerRefresh = async () => {
    if (currentRefreshing) return;
    if (!isControlled) setInternalRefreshing(true);
    try {
      await onRefresh();
    } finally {
      if (!isControlled) setInternalRefreshing(false);
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (currentRefreshing) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = scrollRef.current;
    // Only a genuine pull-from-the-top starts the gesture — content that's already scrolled down
    // should just keep scrolling normally, not get hijacked into a refresh pull.
    if (!el || el.scrollTop > 0) return;

    draggingRef.current = true;
    startYRef.current = e.clientY;
    setIsDragging(true);
    let latestDistance = 0;

    const handleMove = (moveEvent: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = moveEvent.clientY - startYRef.current;
      latestDistance = Math.max(0, Math.min(delta, threshold * 1.5));
      setPullDistance(latestDistance);
    };
    const handleUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setIsDragging(false);
      setPullDistance(0);
      if (latestDistance >= threshold) {
        void triggerRefresh();
      }
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showingPull = pullDistance > 0 || currentRefreshing;

  return (
    <div
      className={clsx("rebar-pull-to-refresh", className)}
      data-rebar-component="pull-to-refresh"
      {...props}
    >
      <div
        className="rebar-pull-to-refresh-indicator"
        data-rebar-part="indicator"
        aria-hidden="true"
        style={{
          opacity: showingPull ? 1 : 0,
          transform: `translateY(${Math.min(pullDistance, threshold) / 2}px)`,
          transition: isDragging ? "none" : "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {currentRefreshing ? (
          <Spin size="sm" spinning />
        ) : (
          <span
            className="rebar-pull-to-refresh-arrow"
            style={{ transform: `rotate(${pullProgress * 180}deg)` }}
          >
            ↓
          </span>
        )}
      </div>
      <button
        type="button"
        className="rebar-pull-to-refresh-button"
        data-rebar-part="refresh-button"
        onClick={() => void triggerRefresh()}
        disabled={currentRefreshing}
        aria-label={currentRefreshing ? "Refreshing" : "Refresh"}
      >
        {currentRefreshing ? "Refreshing…" : "Refresh"}
      </button>
      <div
        ref={scrollRef}
        className="rebar-pull-to-refresh-scroll"
        data-rebar-part="scroll-container"
        onPointerDown={handlePointerDown}
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold * 1.5)}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
