import { useEffect, useState } from "react";
import type { RefObject } from "react";
import clsx from "clsx";

export interface ScrollMaskProps {
  /** The horizontally-scrollable element to track — render `ScrollMask` as a sibling of it,
   * inside a shared `position: relative` wrapper, the same layout antd-mobile's own version uses. */
  scrollTrackRef: RefObject<HTMLElement | null>;
  className?: string;
}

const EPSILON = 1;

/**
 * Two edge-fade gradient overlays (left/right) hinting that a horizontally-scrollable row has
 * more content past what's visible — shown/hidden based on the tracked element's real scroll
 * position, not a guess. Both masks are `pointer-events: none`, so they never block interacting
 * with the actual scrollable content underneath. Ported from antd-mobile's `ScrollMask`, the only
 * component of its kind in this library — nothing existing covers this specific "is there more
 * to scroll" affordance.
 */
export function ScrollMask({ scrollTrackRef, className }: ScrollMaskProps) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const el = scrollTrackRef.current;
    if (!el) return;

    const update = () => {
      setShowStart(el.scrollLeft > EPSILON);
      setShowEnd(el.scrollLeft < el.scrollWidth - el.clientWidth - EPSILON);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    // A ResizeObserver only fires when the tracked element's own box changes — not when its
    // *content* changes width without the container itself resizing (e.g. a chip added to a
    // fixed-width scroll strip). A MutationObserver catches that case too.
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [scrollTrackRef]);

  return (
    <div className={clsx("rebar-scroll-mask", className)} data-rebar-component="scroll-mask">
      <div
        className="rebar-scroll-mask-start"
        data-rebar-part="start"
        aria-hidden="true"
        style={{ opacity: showStart ? 1 : 0 }}
      />
      <div
        className="rebar-scroll-mask-end"
        data-rebar-part="end"
        aria-hidden="true"
        style={{ opacity: showEnd ? 1 : 0 }}
      />
    </div>
  );
}
