import { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

/** Minimal shape this component actually needs from whatever `target()` returns — a real
 * `HTMLElement` or the real `window`, but typed narrowly enough that a union of the two doesn't
 * fight TypeScript's overload resolution for `addEventListener`/`scrollTo`. */
interface ScrollableTarget {
  addEventListener(type: "scroll", listener: () => void, options?: AddEventListenerOptions): void;
  removeEventListener(type: "scroll", listener: () => void, options?: EventListenerOptions): void;
  scrollTo(options: ScrollToOptions): void;
}

export interface BackTopProps
  extends Omit<ComponentPropsWithoutRef<"button">, "className" | "onClick" | "children"> {
  /** How many px the target must have scrolled before this button appears. Default 300. */
  visibilityThreshold?: number;
  /**
   * Which element's scroll position to watch, and which element to scroll back to the top of.
   * Defaults to `() => window`.
   *
   * This is one of the rare, legitimate exceptions to "avoid function props" (see
   * `packages/core/robot.md` checklist item 8): there's no serializable way to name "the window
   * object" or an arbitrary scroll-container element in plain data — a `Block[]` document has no
   * DOM reference to hand this component, so a function is the only way to say "watch and scroll
   * *this* thing" for a caller with a custom scroll container. Passing a non-default `target`
   * makes this component (and any Server Component that renders it) need a `"use client"`
   * boundary, same as any other function prop.
   */
  target?: () => HTMLElement | Window;
  onClick?: () => void;
  /** Defaults to a plain "↑" glyph, matching this project's plain-glyph icon convention (no icon
   * library). */
  children?: ReactNode;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getScrollTop(target: HTMLElement | Window): number {
  return "scrollY" in target ? target.scrollY : target.scrollTop;
}

// A stable module-level default, not an inline `target = () => window` default parameter — an
// inline default would be a brand-new function every render, needlessly re-running the scroll-
// listener effect (which depends on `target`) on every state change this component causes itself.
const defaultTarget = () => window;

/**
 * A floating "back to top" button — hidden until the watched target has scrolled past
 * `visibilityThreshold`, then jumps (smoothly, unless `prefers-reduced-motion` is set) back to its
 * top on click. A real `scroll` listener drives visibility; a real `scrollTo({ behavior })` drives
 * the jump — no CSS-only trick stands in for either, since both are genuine scroll-position state.
 *
 * Fixed-position bottom-right by default via CSS, overridable through `className`/`style` like
 * every other component here. Scroll-*reactive*, never scroll-*blocking* — it doesn't set
 * `overflow`/`touch-action` on anything, so it can never interfere with the page's own real
 * scrolling.
 */
export function BackTop({
  visibilityThreshold = 300,
  target = defaultTarget,
  onClick,
  children,
  className,
  "aria-label": ariaLabel = "Back to top",
  ...props
}: BackTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = target() as unknown as ScrollableTarget;
    const handleScroll = () => {
      setVisible(getScrollTop(target()) > visibilityThreshold);
    };
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [target, visibilityThreshold]);

  const handleClick = () => {
    const el = target() as unknown as ScrollableTarget;
    el.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    onClick?.();
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      {...props}
      onClick={handleClick}
      className={clsx("rebar-back-top", className)}
      data-rebar-component="back-top"
      aria-label={ariaLabel}
    >
      {children ?? "↑"}
    </button>
  );
}
