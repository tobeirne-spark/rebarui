import { forwardRef, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Editable } from "./Editable";
import { Empty } from "./Empty";
import { Popconfirm } from "./Popconfirm";
import { Button } from "./Button";
import { Text } from "./Text";

export interface GoalTrackerGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoalTrackerFocusArea {
  id: string;
  text: string;
  goals: GoalTrackerGoal[];
}

export interface GoalTrackerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  aspiration: string;
  focusAreas: GoalTrackerFocusArea[];
  onAspirationChange?: (text: string) => void;
  onFocusAreaChange?: (id: string, text: string) => void;
  onGoalChange?: (focusAreaId: string, goalId: string, text: string) => void;
  onGoalToggle?: (focusAreaId: string, goalId: string, completed: boolean) => void;
  onDelete?: (kind: "focusArea" | "goal", ids: { focusAreaId: string; goalId?: string }) => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Even spacing around the toggle, one arm per particle. A plain, deterministic layout (not
// Math.random) — this only ever renders after a real client click, never during SSR, so there's
// no hydration-mismatch concern here (unlike the trig-derived chart coordinates robot.md warns
// about), but a fixed pattern reads just as celebratory as a random one and is easier to reason
// about/test.
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const BURST_COLORS = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-info, #0288d1)",
];
const BURST_DURATION_MS = 650;

/**
 * A hand-rolled, dependency-free celebratory burst — a handful of colored dots animated outward
 * via a CSS keyframe (`transform`/`opacity`), matching how `Toast`/`Watermark` already avoid
 * pulling in a library for a comparable one-off visual effect. Each dot sits inside its own
 * "arm" `<span>` whose inline `rotate()` is set once in JS (the same "compute the static rotation
 * in JS, let CSS animate the rest" split `Sticky.tsx` already uses for its own procedural
 * rotation) — the CSS keyframe itself only ever animates `translateX`/`opacity` on the inner dot,
 * so no custom CSS property plumbing is needed to vary the direction per particle.
 */
function ConfettiBurst() {
  return (
    <span className="rebar-goal-tracker-burst" data-rebar-part="goal-burst" aria-hidden="true">
      {BURST_ANGLES.map((angle, index) => (
        <span
          key={angle}
          className="rebar-goal-tracker-burst-arm"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span
            className="rebar-goal-tracker-burst-particle"
            style={{ background: BURST_COLORS[index % BURST_COLORS.length] }}
          />
        </span>
      ))}
    </span>
  );
}

interface GoalToggleProps {
  completed: boolean;
  label: string;
  onToggle: (completed: boolean) => void;
}

/**
 * The real toggle-to-complete control — a real `<button role="checkbox">`, not a styled `<div>`,
 * ≥44×44 CSS px (checklist item 5). Fires the confetti burst only when toggling INTO completed
 * (never on un-completing), and only when `prefers-reduced-motion` isn't set — no reduced-motion
 * variant of a purely celebratory animation, it's just skipped entirely, same call `BackTop`'s own
 * `prefersReducedMotion` check already makes for its scroll behavior.
 */
function GoalToggle({ completed, label, onToggle }: GoalToggleProps) {
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
    if (next && !prefersReducedMotion()) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const id = nextBurstIdRef.current++;
      setBurstId(id);
      timeoutRef.current = setTimeout(() => setBurstId(null), BURST_DURATION_MS);
    }
  };

  return (
    <span className="rebar-goal-tracker-toggle-wrap">
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={label}
        className={clsx(
          "rebar-goal-tracker-toggle",
          completed && "rebar-goal-tracker-toggle-completed",
        )}
        data-rebar-part="goal-toggle"
        onClick={handleClick}
      >
        {completed ? "✓" : ""}
      </button>
      {burstId !== null ? <ConfettiBurst key={burstId} /> : null}
    </span>
  );
}

/**
 * A hierarchical goal/OKR tracker: one top-level Aspiration, several Focus Areas, each holding
 * several Goals — rendered as an editable nested list. Inline text editing at all three levels
 * reuses the real `Editable` component (never hand-rolled contentEditable); each goal has a real
 * toggle-to-complete control that fires a small celebratory burst on completion; deletion at the
 * focus-area/goal level goes through the real `Popconfirm` since it's a genuinely destructive
 * action. An empty `focusAreas` array renders the shared `Empty` component instead of a bare
 * aspiration header with nothing under it.
 */
export const GoalTracker = forwardRef<HTMLDivElement, GoalTrackerProps>(function GoalTracker(
  {
    aspiration,
    focusAreas,
    onAspirationChange,
    onFocusAreaChange,
    onGoalChange,
    onGoalToggle,
    onDelete,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx("rebar-goal-tracker", className)}
      data-rebar-component="goal-tracker"
      {...props}
    >
      <div className="rebar-goal-tracker-aspiration" data-rebar-part="aspiration">
        <Editable
          value={aspiration}
          onChange={onAspirationChange}
          aria-label="Aspiration"
          placeholder="Set an aspiration"
          className="rebar-goal-tracker-aspiration-text"
        />
      </div>

      {focusAreas.length === 0 ? (
        <Empty description="No focus areas yet" />
      ) : (
        <ul className="rebar-goal-tracker-focus-areas" data-rebar-part="focus-area-list">
          {focusAreas.map((focusArea) => {
            const total = focusArea.goals.length;
            const completedCount = focusArea.goals.filter((goal) => goal.completed).length;

            return (
              <li
                key={focusArea.id}
                className="rebar-goal-tracker-focus-area"
                data-rebar-part="focus-area"
              >
                <div className="rebar-goal-tracker-focus-area-header">
                  <Editable
                    value={focusArea.text}
                    onChange={(text) => onFocusAreaChange?.(focusArea.id, text)}
                    aria-label="Focus area"
                    placeholder="Name this focus area"
                    className="rebar-goal-tracker-focus-area-text"
                  />
                  <Text
                    size="sm"
                    color="secondary"
                    data-rebar-part="focus-area-progress"
                    className="rebar-goal-tracker-focus-area-progress"
                  >
                    {completedCount} of {total} complete
                  </Text>
                  <Popconfirm
                    trigger={
                      <Button
                        type="button"
                        variant="tertiary"
                        aria-label={`Delete focus area "${focusArea.text}"`}
                        data-rebar-part="focus-area-delete"
                      >
                        Delete
                      </Button>
                    }
                    title={`Delete "${focusArea.text || "this focus area"}"?`}
                    description="This removes the focus area and all of its goals."
                    destructive
                    onConfirm={() => onDelete?.("focusArea", { focusAreaId: focusArea.id })}
                  />
                </div>

                {focusArea.goals.length === 0 ? (
                  <Text
                    size="sm"
                    color="secondary"
                    className="rebar-goal-tracker-no-goals"
                    data-rebar-part="no-goals"
                  >
                    No goals yet
                  </Text>
                ) : (
                  <ul className="rebar-goal-tracker-goals" data-rebar-part="goal-list">
                    {focusArea.goals.map((goal) => (
                      <li key={goal.id} className="rebar-goal-tracker-goal" data-rebar-part="goal">
                        <GoalToggle
                          completed={goal.completed}
                          label={`Mark "${goal.text || "this goal"}" as ${
                            goal.completed ? "incomplete" : "complete"
                          }`}
                          onToggle={(completed) => onGoalToggle?.(focusArea.id, goal.id, completed)}
                        />
                        <Editable
                          value={goal.text}
                          onChange={(text) => onGoalChange?.(focusArea.id, goal.id, text)}
                          aria-label="Goal"
                          placeholder="Name this goal"
                          className={clsx(
                            "rebar-goal-tracker-goal-text",
                            goal.completed && "rebar-goal-tracker-goal-text-completed",
                          )}
                        />
                        <Popconfirm
                          trigger={
                            <Button
                              type="button"
                              variant="tertiary"
                              aria-label={`Delete goal "${goal.text}"`}
                              data-rebar-part="goal-delete"
                            >
                              Delete
                            </Button>
                          }
                          title={`Delete "${goal.text || "this goal"}"?`}
                          destructive
                          onConfirm={() =>
                            onDelete?.("goal", { focusAreaId: focusArea.id, goalId: goal.id })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
