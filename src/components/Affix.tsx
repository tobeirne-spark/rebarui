import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface AffixProps extends Omit<ComponentPropsWithoutRef<"div">, "className" | "children"> {
  /** How far from the viewport top to pin at, in px. Default 0. */
  offsetTop?: number;
  children: ReactNode;
  /** Fires whenever the pinned state actually changes (not on every scroll event). */
  onAffixChange?: (affixed: boolean) => void;
  className?: string;
}

/** Plain rAF-throttle: at most one `measure()` per animation frame no matter how many `scroll`
 * events fire in between, the standard technique for a scroll handler that reads layout
 * (`getBoundingClientRect`) — this codebase's other scroll-driven component (`SectionNav`) uses the
 * same `requestAnimationFrame` idiom for its own scroll-position bookkeeping. */
function useRafThrottled(callback: () => void) {
  const rafRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return () => {
    if (rafRef.current !== undefined) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      callbackRef.current();
    });
  };
}

/**
 * Pins its children in place once the page scrolls past their normal position — `position: fixed`
 * at `offsetTop`, with a same-sized placeholder left in the document flow so nothing else visually
 * jumps the moment the real content leaves flow (the well-known "sticky/affix" implementation
 * detail: a plain CSS `position: sticky` would suffice for the pinning itself, but this component
 * also needs to report a real `onAffixChange` transition, which `position: sticky` has no event
 * for).
 *
 * Scroll-*reactive* only — no `overflow`/`touch-action` is ever set here, so native page scroll is
 * never blocked.
 */
export function Affix({ offsetTop = 0, children, onAffixChange, className, ...props }: AffixProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const affixedRef = useRef(false);
  const [affixed, setAffixed] = useState(false);
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);

  const measure = () => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    // The wrapper's own rect — once affixed, the placeholder (still in flow, sized to match the
    // now-fixed content) is what keeps this measurement meaningful; the content itself is out of
    // flow at that point and its rect no longer reflects the natural scroll-driven position.
    const shouldAffix = wrapper.getBoundingClientRect().top < offsetTop;

    if (shouldAffix !== affixedRef.current) {
      if (shouldAffix) {
        const rect = content.getBoundingClientRect();
        setContentSize({ width: rect.width, height: rect.height });
      }
      affixedRef.current = shouldAffix;
      setAffixed(shouldAffix);
      onAffixChange?.(shouldAffix);
    }
  };

  const throttledMeasure = useRafThrottled(measure);

  useEffect(() => {
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("scroll", throttledMeasure, { passive: true });
    window.addEventListener("resize", throttledMeasure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", throttledMeasure);
      window.removeEventListener("resize", throttledMeasure);
    };
  }, [offsetTop]);

  return (
    <div ref={wrapperRef} className={clsx("rebar-affix", className)} data-rebar-component="affix" {...props}>
      {affixed ? (
        <div
          className="rebar-affix-placeholder"
          data-rebar-part="placeholder"
          aria-hidden="true"
          style={contentSize ? { width: contentSize.width, height: contentSize.height } : undefined}
        />
      ) : null}
      <div
        ref={contentRef}
        className="rebar-affix-content"
        data-rebar-part="content"
        style={affixed ? { position: "fixed", top: offsetTop, width: contentSize?.width } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
