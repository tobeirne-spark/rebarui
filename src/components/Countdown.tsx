import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface CountdownProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The moment to count down to. */
  target: Date | string | number;
  /** Fires once, the moment the countdown reaches zero — not on every tick. */
  onComplete?: () => void;
  /** Formats the remaining time for display. Defaults to `"Xd HHh MMm SSs"`, dropping leading
   * zero units (no "0d" prefix once under a day left). */
  format?: (remainingMs: number) => ReactNode;
}

function defaultFormat(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (hours > 0) return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * A ticking countdown to a target time — real time-driven display, but not a branching state
 * machine (the same distinction that kept `Affix`/`BackTop`/`ScrollMask` Synthetic despite having
 * real internal state): the value mirrors the clock, nothing about the component's own rendered
 * *mode* changes based on it, beyond stopping at zero. See ref/TIERS.md.
 */
export function Countdown({ target, onComplete, format = defaultFormat, className, ...props }: CountdownProps) {
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()));
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const next = Math.max(0, targetMs - Date.now());
      setRemaining(next);
      if (next === 0 && !firedRef.current) {
        firedRef.current = true;
        onComplete?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-ticking on every onComplete identity change would restart the interval needlessly; targetMs already captures the real dependency.
  }, [targetMs]);

  return (
    <div
      className={clsx("rebar-countdown", className)}
      data-rebar-component="countdown"
      data-rebar-complete={remaining === 0 || undefined}
      {...props}
    >
      {format(remaining)}
    </div>
  );
}
