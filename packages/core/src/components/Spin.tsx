import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";
import { useDelayedLoading } from "../useDelayedLoading";
import { HOURGLASS_SPINNER, HOURGLASS_SPINNER_DARK } from "../assets/hourglassSpinner";
import { DRUM_ROLL_SPINNER, DRUM_ROLL_SPINNER_DARK } from "../assets/drumRollSpinner";
import { FLYING_PAPERS_SPINNER, FLYING_PAPERS_SPINNER_DARK } from "../assets/flyingPapersSpinner";

export type SpinSize = "sm" | "md" | "lg";
export type SpinVariant = "drums" | "hourglass" | "papers" | "classic";

const VARIANT_SRC: Record<string, { light: string; dark: string }> = {
  drums: { light: DRUM_ROLL_SPINNER, dark: DRUM_ROLL_SPINNER_DARK },
  hourglass: { light: HOURGLASS_SPINNER, dark: HOURGLASS_SPINNER_DARK },
  papers: { light: FLYING_PAPERS_SPINNER, dark: FLYING_PAPERS_SPINNER_DARK },
};

export interface SpinProps {
  spinning?: boolean;
  size?: SpinSize;
  variant?: SpinVariant;
  tip?: string;
  children?: ReactNode;
  className?: string;
  /** Force bionic reading on/off for `tip`, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  /** Waits this long before showing the spinner at all — a `spinning` that goes back to `false`
   * before this elapses never renders anything, the fix for a near-instant (e.g. local, in-memory)
   * operation flashing a spinner for a single frame. Unset by default (shows immediately, exactly
   * today's behavior) — see `ref/HEURISTICS.md` #52 and `useDelayedLoading`. */
  delayMs?: number;
  /** Once shown, keeps the spinner up for at least this long, even if `spinning` goes back to
   * `false` sooner. Unset by default (hides immediately). */
  minDurationMs?: number;
}

function VectorSpinner({ size, className }: { size: SpinSize; className?: string }) {
  return (
    <svg
      className={clsx("rebar-spin-icon", "rebar-spin-icon-vector", `rebar-spin-icon-${size}`, className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The three illustrated variants each have a real light-mode AND dark-mode redraw (same
// hand-sketched frames, light ink on transparent instead of dark ink on white) — CSS toggles
// which is visible via [data-theme="dark"], so the illustration itself survives a theme switch
// instead of falling back to a generic spinner. "classic" has no illustrated art at all — it's
// always the plain vector spinner, selectable directly, in any theme, not just as a fallback.
function Spinner({
  size,
  variant,
  tip,
  bionic,
  bionicOptions,
}: {
  size: SpinSize;
  variant: SpinVariant;
  tip?: string;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}) {
  const raster = variant !== "classic" ? VARIANT_SRC[variant] : null;
  const tipContent = useBionicChildren(tip, bionic, bionicOptions);
  return (
    <span
      className="rebar-spin-indicator"
      data-rebar-part="indicator"
      role="status"
      aria-label={tip ?? "Loading"}
    >
      {raster ? (
        <>
          <img
            className={clsx(
              "rebar-spin-icon",
              "rebar-spin-icon-raster",
              "rebar-spin-icon-raster-light",
              `rebar-spin-icon-${size}`,
            )}
            src={raster.light}
            alt=""
          />
          <img
            className={clsx(
              "rebar-spin-icon",
              "rebar-spin-icon-raster",
              "rebar-spin-icon-raster-dark",
              `rebar-spin-icon-${size}`,
            )}
            src={raster.dark}
            alt=""
          />
        </>
      ) : (
        <VectorSpinner size={size} className="rebar-spin-icon-classic" />
      )}
      {tip ? (
        <span className="rebar-spin-tip" data-rebar-part="tip">
          {tipContent}
        </span>
      ) : null}
    </span>
  );
}

export const Spin = forwardRef<HTMLDivElement, SpinProps>(function Spin(
  {
    spinning: spinningProp = true,
    size = "md",
    variant = "drums",
    tip,
    children,
    className,
    bionic,
    bionicOptions,
    delayMs,
    minDurationMs,
  },
  ref,
) {
  const hasDelayConfig = (delayMs ?? 0) > 0 || (minDurationMs ?? 0) > 0;
  // Always called (no conditional-hook issue) — only its result is used, and only once a
  // delay/minimum-duration is actually configured; otherwise `spinning` passes through exactly as
  // before, synchronously, with no added tick.
  const delayedSpinning = useDelayedLoading(spinningProp, { delayMs, minDurationMs });
  const spinning = hasDelayConfig ? delayedSpinning : spinningProp;

  if (!children) {
    return spinning ? (
      <div ref={ref} className={className} data-rebar-component="spin">
        <Spinner size={size} variant={variant} tip={tip} bionic={bionic} bionicOptions={bionicOptions} />
      </div>
    ) : null;
  }

  return (
    <div ref={ref} className={clsx("rebar-spin-container", className)} data-rebar-component="spin">
      <div
        className="rebar-spin-content"
        data-rebar-part="content"
        aria-busy={spinning}
        style={spinning ? { opacity: 0.5, pointerEvents: "none" } : undefined}
      >
        {children}
      </div>
      {spinning ? (
        <div className="rebar-spin-overlay" data-rebar-part="overlay">
          <Spinner size={size} variant={variant} tip={tip} bionic={bionic} bionicOptions={bionicOptions} />
        </div>
      ) : null}
    </div>
  );
});
