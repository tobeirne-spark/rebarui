import { forwardRef, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import clsx from "clsx";

export interface TodoItemProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onToggle"> {
  /** The item's own content — a plain string, or a richer node (e.g. an `Editable` for inline
   * renaming). Rendered next to the toggle, not inside it. */
  label: ReactNode;
  completed: boolean;
  onToggle: (completed: boolean) => void;
  /** The toggle button's accessible name (e.g. `Mark "Ship the release" as complete`) — required
   * rather than derived, since `label` may not be plain text. */
  toggleLabel: string;
  /** Confetti burst intensity on completing the item — `"small"` (default) is a subtle burst,
   * `"big"` a larger, more numerous, longer-traveling one, `"none"` disables it entirely. Always
   * skipped outright when `prefers-reduced-motion` is set, regardless of this prop. */
  celebration?: "none" | "small" | "big";
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const BURST_COLORS = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-info, #0288d1)",
];

interface CelebrationConfig {
  angles: number[];
  particleSize: number;
  travel: number;
  durationMs: number;
}

// Even spacing around the toggle, one arm per particle. A plain, deterministic layout (not
// Math.random) — this only ever renders after a real client click, never during SSR, so there's
// no hydration-mismatch concern here, but a fixed pattern reads just as celebratory as a random
// one and is easier to reason about/test. "big" uses more arms, bigger particles, and a longer
// travel distance than "small".
const CELEBRATION_CONFIG: Record<"small" | "big", CelebrationConfig> = {
  small: { angles: [0, 45, 90, 135, 180, 225, 270, 315], particleSize: 6, travel: 28, durationMs: 600 },
  big: {
    angles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    particleSize: 10,
    travel: 52,
    durationMs: 750,
  },
};

/**
 * A hand-rolled, dependency-free celebratory burst — a handful of colored dots animated outward
 * via a CSS keyframe (`transform`/`opacity`), matching how `Toast`/`Watermark` already avoid
 * pulling in a library for a comparable one-off visual effect.
 */
function ConfettiBurst({ config }: { config: CelebrationConfig }) {
  return (
    <span className="rebar-todo-item-burst" data-rebar-part="burst" aria-hidden="true">
      {config.angles.map((angle, index) => (
        <span
          key={angle}
          className="rebar-todo-item-burst-arm"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span
            className="rebar-todo-item-burst-particle"
            style={
              {
                width: config.particleSize,
                height: config.particleSize,
                marginTop: -config.particleSize / 2,
                marginLeft: -config.particleSize / 2,
                background: BURST_COLORS[index % BURST_COLORS.length],
                animationDuration: `${config.durationMs}ms`,
                "--rebar-todo-item-burst-travel": `${config.travel}px`,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </span>
  );
}

/**
 * A checkable row: a real `<button role="checkbox">` toggle (≥44×44 CSS px, checklist item 5),
 * an arbitrary label slot next to it, and an optional celebratory confetti burst on completion.
 * The reusable primitive behind `GoalTracker`'s per-goal rows — extracted so any consuming app's
 * own checklist/todo UI can use the same toggle-plus-celebration control directly, without
 * pulling in the rest of `GoalTracker`'s aspiration/focus-area hierarchy.
 */
export const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(function TodoItem(
  { label, completed, onToggle, toggleLabel, celebration = "small", className, ...props },
  ref,
) {
  const [burstId, setBurstId] = useState<number | null>(null);
  const nextBurstIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    const next = !completed;
    onToggle(next);
    if (next && celebration !== "none" && !prefersReducedMotion()) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const id = nextBurstIdRef.current++;
      setBurstId(id);
      const { durationMs } = CELEBRATION_CONFIG[celebration];
      timeoutRef.current = setTimeout(() => setBurstId(null), durationMs + 50);
    }
  };

  return (
    <div ref={ref} className={clsx("rebar-todo-item", className)} data-rebar-component="todo-item" {...props}>
      <span className="rebar-todo-item-toggle-wrap">
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-label={toggleLabel}
          className={clsx("rebar-todo-item-toggle", completed && "rebar-todo-item-toggle-completed")}
          data-rebar-part="toggle"
          onClick={handleClick}
        >
          {completed ? "✓" : ""}
        </button>
        {burstId !== null && celebration !== "none" ? (
          <ConfettiBurst key={burstId} config={CELEBRATION_CONFIG[celebration]} />
        ) : null}
      </span>
      <div className="rebar-todo-item-label" data-rebar-part="label">
        {label}
      </div>
    </div>
  );
});
