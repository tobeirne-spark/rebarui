import { useEffect, useId, useLayoutEffect, useState } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Button } from "./Button";
import { Heading } from "./Heading";

export interface TourStep {
  /**
   * Returns the real, already-mounted DOM element to highlight for this step, or `null` if it
   * isn't found (not yet rendered, conditionally hidden, etc.) — that step's callout still
   * renders (centered on screen) rather than crashing. A function is a deliberate, accepted
   * exception to "no function props": there's no serializable way to say "the third button on
   * the page" otherwise. The same call `BackTop`'s own `target` prop makes.
   */
  target: () => HTMLElement | null;
  title: string;
  description?: string;
}

export interface TourProps extends ComponentPropsWithoutRef<"div"> {
  steps: TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which step is active — independent of `open`, matching `Calendar`'s own two-independent-pairs
   * precedent (`value`/`month`): a tour can be paused/resumed without losing its place. */
  currentStep?: number;
  onStepChange?: (index: number) => void;
  onFinish?: () => void;
}

const GAP = 12;
// A simple heuristic, not real collision-aware positioning (Radix's own Popover does that): a
// fixed estimate of the callout's own footprint, used only to decide which side has enough room.
const ESTIMATED_CALLOUT_WIDTH = 320;
const ESTIMATED_CALLOUT_HEIGHT = 160;

type Placement = "top" | "bottom" | "left" | "right" | "center";

function pickPlacement(rect: DOMRect | null, viewportW: number, viewportH: number): Placement {
  if (!rect) return "center";
  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = viewportW - rect.right;
  const spaceLeft = rect.left;
  if (spaceBelow >= ESTIMATED_CALLOUT_HEIGHT + GAP) return "bottom";
  if (spaceAbove >= ESTIMATED_CALLOUT_HEIGHT + GAP) return "top";
  if (spaceRight >= ESTIMATED_CALLOUT_WIDTH + GAP) return "right";
  if (spaceLeft >= ESTIMATED_CALLOUT_WIDTH + GAP) return "left";
  return "bottom";
}

function calloutStyle(
  rect: DOMRect | null,
  placement: Placement,
  viewportW: number,
  viewportH: number,
): CSSProperties {
  if (!rect || placement === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  const clampedLeft = Math.min(
    Math.max(rect.left, GAP),
    Math.max(viewportW - ESTIMATED_CALLOUT_WIDTH - GAP, GAP),
  );
  const clampedTop = Math.min(
    Math.max(rect.top, GAP),
    Math.max(viewportH - ESTIMATED_CALLOUT_HEIGHT - GAP, GAP),
  );
  switch (placement) {
    case "bottom":
      return { top: rect.bottom + GAP, left: clampedLeft };
    case "top":
      return { bottom: viewportH - rect.top + GAP, left: clampedLeft };
    case "right":
      return { left: rect.right + GAP, top: clampedTop };
    case "left":
      return { right: viewportW - rect.left + GAP, top: clampedTop };
    default:
      return {};
  }
}

/**
 * A guided, sequential product walkthrough: a dimming mask over the whole page with one real
 * target element "cut out" (highlighted) at a time, plus a small callout card near it with
 * Prev/Next/Skip/Finish controls stepping through `steps` in order.
 *
 * Overlay-cutout technique: four separate `position: fixed` mask divs framing the target's own
 * `getBoundingClientRect()` (top/bottom/left/right strips), not an SVG `<mask>` — simpler to
 * reason about and to test, and it has a side benefit: since no mask div actually covers the
 * target's own rect, the real element underneath stays genuinely clickable/focusable for tours
 * that want the user to interact with it, not just look at it.
 *
 * Scroll lock: the page's own scroll is intentionally locked (`document.body.style.overflow =
 * "hidden"`) for as long as the tour is open — the same modal convention `Dialog`'s own Radix
 * wiring already applies, not an oversight. The highlighted rect is a snapshot of the target's
 * position; this component re-measures on resize/scroll of any ancestor, but locking the page's
 * own scroll avoids the cutout ever visibly lagging a fast scroll gesture.
 */
export function Tour({
  steps,
  open,
  defaultOpen,
  onOpenChange,
  currentStep,
  onStepChange,
  onFinish,
  className,
  ...rest
}: TourProps) {
  const isOpenControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isOpenControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isOpenControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const isStepControlled = currentStep !== undefined;
  const [internalStep, setInternalStep] = useState(0);
  const activeStep = isStepControlled ? currentStep : internalStep;
  const setStep = (next: number) => {
    if (!isStepControlled) setInternalStep(next);
    onStepChange?.(next);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const step = steps[activeStep];
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!currentOpen || !step) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = step.target();
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [currentOpen, activeStep, step]);

  useEffect(() => {
    if (!currentOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [currentOpen]);

  const headingId = useId();

  if (!currentOpen || !step || !mounted) return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const placement = pickPlacement(rect, viewportW, viewportH);
  const style = calloutStyle(rect, placement, viewportW, viewportH);

  const isFirst = activeStep === 0;
  const isLast = activeStep === steps.length - 1;

  const goPrev = () => {
    if (!isFirst) setStep(activeStep - 1);
  };
  const goNext = () => {
    if (isLast) {
      onFinish?.();
      setOpen(false);
    } else {
      setStep(activeStep + 1);
    }
  };
  const skip = () => setOpen(false);

  return createPortal(
    <div className={clsx("rebar-tour", className)} data-rebar-component="tour" {...rest}>
      <div className="rebar-tour-overlay" data-rebar-part="overlay">
        {rect ? (
          <>
            <div
              className="rebar-tour-mask"
              data-rebar-part="mask"
              style={{ top: 0, left: 0, right: 0, height: Math.max(rect.top, 0) }}
            />
            <div
              className="rebar-tour-mask"
              data-rebar-part="mask"
              style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }}
            />
            <div
              className="rebar-tour-mask"
              data-rebar-part="mask"
              style={{ top: rect.top, left: 0, width: Math.max(rect.left, 0), height: rect.height }}
            />
            <div
              className="rebar-tour-mask"
              data-rebar-part="mask"
              style={{ top: rect.top, left: rect.right, right: 0, height: rect.height }}
            />
            <div
              className="rebar-tour-highlight rebar-active-border"
              data-rebar-part="highlight"
              style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            />
          </>
        ) : (
          <div
            className="rebar-tour-mask"
            data-rebar-part="mask"
            // Longhand, not `inset: 0` — see Watermark.tsx's own overlay for why: a real SSR
            // hydration mismatch, since a browser's CSSOM normalizes `inset` into these four
            // longhand properties immediately on parsing server-rendered HTML, and React's
            // client-side reconciliation still expects the shorthand form.
            style={{ top: 0, right: 0, bottom: 0, left: 0 }}
          />
        )}
      </div>
      <div
        className="rebar-tour-callout"
        data-rebar-part="callout"
        style={style}
        role="dialog"
        aria-labelledby={headingId}
      >
        <Heading level={3} id={headingId} data-rebar-part="title">
          {step.title}
        </Heading>
        {step.description ? <p data-rebar-part="description">{step.description}</p> : null}
        <div className="rebar-tour-progress" data-rebar-part="progress">
          {activeStep + 1} / {steps.length}
        </div>
        <div className="rebar-tour-actions" data-rebar-part="actions">
          <Button type="button" variant="tertiary" onClick={skip} data-rebar-part="skip">
            Skip
          </Button>
          <div className="rebar-tour-nav" data-rebar-part="nav">
            {!isFirst ? (
              <Button type="button" variant="secondary" onClick={goPrev} data-rebar-part="prev">
                Prev
              </Button>
            ) : null}
            <Button type="button" variant="primary" onClick={goNext} data-rebar-part="next">
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
