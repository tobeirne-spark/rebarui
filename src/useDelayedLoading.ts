import { useEffect, useRef, useState } from "react";

export interface UseDelayedLoadingOptions {
  /** Wait this long before showing the loading state at all. A `loading` that goes back to
   * `false` before this elapses never shows anything — the fix for a raw loading boolean flashing
   * a skeleton/spinner for a single frame on a near-instant (e.g. local, in-memory) operation.
   * Default `0` (show as soon as this hook's own effect runs — see the note below on the one
   * unavoidable tick that adds relative to using the raw boolean directly). */
  delayMs?: number;
  /** Once shown, keep showing for at least this long, even if `loading` goes back to `false`
   * sooner — avoids a flicker shorter than a human can register on an operation that resolves
   * just after `delayMs` elapses. Default `0` (hide as soon as this hook's own effect runs). */
  minDurationMs?: number;
}

/**
 * Wraps a raw `loading` boolean with a show-delay and/or a minimum-display-duration, so a
 * near-instant operation never flashes a loading indicator at all, and a just-barely-slow one
 * doesn't flicker off the instant it resolves. See `ref/HEURISTICS.md` #52 — a loading indicator
 * driven by an unguarded boolean has no way to make either judgment on its own; this hook is that
 * guard, for any component (this library's own `Table`/`Spin`, or a consumer's own loading UI).
 *
 * Always resolves through a `useEffect`, even with both options at their `0` default — one tick
 * later than using `loading` directly. `Table`/`Spin` only call this hook at all when `delayMs`/
 * `minDurationMs` is actually set, using the raw prop otherwise, to keep their own default
 * behavior exactly synchronous; do the same in your own code if an exact passthrough matters.
 */
export function useDelayedLoading(loading: boolean, options: UseDelayedLoadingOptions = {}): boolean {
  const { delayMs = 0, minDurationMs = 0 } = options;
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (loading) {
      if (delayMs > 0) {
        timer = setTimeout(() => {
          shownAtRef.current = Date.now();
          setVisible(true);
        }, delayMs);
      } else {
        shownAtRef.current = Date.now();
        setVisible(true);
      }
    } else {
      const shownAt = shownAtRef.current;
      const elapsed = shownAt !== null ? Date.now() - shownAt : Infinity;
      const remaining = Math.max(0, minDurationMs - elapsed);
      if (remaining > 0) {
        timer = setTimeout(() => {
          shownAtRef.current = null;
          setVisible(false);
        }, remaining);
      } else {
        shownAtRef.current = null;
        setVisible(false);
      }
    }
    return () => clearTimeout(timer);
  }, [loading, delayMs, minDurationMs]);

  return visible;
}
