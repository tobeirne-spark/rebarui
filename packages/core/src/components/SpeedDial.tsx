import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";

export interface SpeedDialAction {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface SpeedDialProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The closed-state FAB's own icon/glyph. Defaults to a plain "+" glyph, matching this
   * project's existing no-icon-library convention (a text character, not an SVG asset). */
  icon?: ReactNode;
  actions: SpeedDialAction[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which way the sub-actions fan out from the main button. Default "up". */
  direction?: "up" | "down" | "left" | "right";
}

const isColumn = (direction: SpeedDialProps["direction"]) => direction === "up" || direction === "down";

/**
 * A floating action button that expands into several labeled sub-actions on click (the Material
 * Design SpeedDial pattern). The main button is a real, >=44x44 `Button`; every revealed action
 * is also a real, keyboard-focusable `Button` with a visible text label (never icon-only — see
 * ref/HEURISTICS.md #13), not a hover-reveal or a decorative-only affordance.
 *
 * Controlled/uncontrolled like every other stateful rebar-ui component (`open`/`defaultOpen`/
 * `onOpenChange`, same `isControlled`/`internalOpen`/`currentOpen` pattern `ActionSheet` uses).
 *
 * UX choice, stated: selecting an action calls its own `onSelect` and then closes the dial,
 * mirroring `ActionSheet`'s own "picking an action is a complete choice" convention — a
 * SpeedDial's actions are one-shot commands, not toggles, so leaving it open after a pick would
 * just be a stale, oddly-still-open FAB. In controlled mode, "closes the dial" means calling
 * `onOpenChange(false)` — the caller's own state decides whether it actually closes, same as
 * every other controlled component here.
 */
export function SpeedDial({
  icon,
  actions,
  open,
  defaultOpen,
  onOpenChange,
  direction = "up",
  className,
  ...props
}: SpeedDialProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleSelect = (action: SpeedDialAction) => {
    action.onSelect();
    handleOpenChange(false);
  };

  const column = isColumn(direction);
  // First array item renders nearest the main button: for "up"/"left" the actions sit before
  // the trigger in flow order (so the trailing end of the actions stack, i.e. the *last*
  // rendered action, is nearest the button) — reverse the list so index 0 still ends up nearest
  // the button visually. For "down"/"right" the actions come after the trigger, so no reversal
  // is needed for index 0 to land nearest it.
  const actionsBeforeTrigger = direction === "up" || direction === "left";
  const orderedActions = actionsBeforeTrigger ? [...actions].slice().reverse() : actions;

  // Not rendered at all when closed (rather than present-but-`display: none`) — a closed
  // SpeedDial's actions aren't reachable by keyboard, so they shouldn't exist in the tab order
  // either; conditionally mounting is the simplest way to guarantee that by construction.
  const actionsList = currentOpen ? (
    <div
      className="rebar-speed-dial-actions"
      data-rebar-part="actions"
      style={{
        display: "flex",
        flexDirection: column ? "column" : "row",
        gap: "var(--rebar-space-sm, 8px)",
      }}
    >
      {orderedActions.map((action, i) => (
        <Button
          key={`${action.label}-${i}`}
          type="button"
          variant="secondary"
          className="rebar-speed-dial-action"
          data-rebar-part="action"
          onClick={() => handleSelect(action)}
        >
          {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
          {action.label}
        </Button>
      ))}
    </div>
  ) : null;

  const trigger = (
    <Button
      type="button"
      variant="primary"
      className="rebar-speed-dial-trigger"
      data-rebar-part="trigger"
      aria-expanded={currentOpen}
      aria-label={currentOpen ? "Close actions" : "Open actions"}
      onClick={() => handleOpenChange(!currentOpen)}
      style={{ minWidth: 44, minHeight: 44, borderRadius: "50%", padding: 0 }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          // A plain "+" glyph reads fine at the button's own default text size, but a real icon
          // (an SVG from packages/core/src/components/icons.tsx, sized in `em`s) inherits that
          // same small ~14px font-size otherwise, rendering tiny and lost inside a 44px circular
          // button — this gives custom icons real room to fill it properly.
          fontSize: icon ? "1.5em" : undefined,
          transform: currentOpen ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 200ms",
        }}
      >
        {icon ?? "+"}
      </span>
    </Button>
  );

  return (
    <div
      className={clsx("rebar-speed-dial", className)}
      data-rebar-component="speed-dial"
      data-rebar-direction={direction}
      style={{ display: "flex", flexDirection: column ? "column" : "row", alignItems: "center", gap: "var(--rebar-space-sm, 8px)" }}
      {...props}
    >
      {actionsBeforeTrigger ? actionsList : null}
      {trigger}
      {actionsBeforeTrigger ? null : actionsList}
    </div>
  );
}
