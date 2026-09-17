import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Heading } from "./Heading";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export interface SidePanelProps extends Omit<ComponentPropsWithoutRef<"aside">, "children" | "title"> {
  title?: ReactNode;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hides the built-in collapse-to-rail toggle (the header's × when open, the rail's chevron
   * when collapsed) — for a caller driving `open` from its own UI elsewhere instead. Default
   * `false`. */
  hideToggle?: boolean;
  /** The open panel's width in px. Default `320`. */
  width?: number;
  className?: string;
}

/**
 * A persistent, non-modal side panel — the Slack "thread"/"details" pattern: it sits *beside* the
 * main content, in normal document flow, not over it. Distinct from `Drawer`/`BottomSheet`/
 * `ActionSheet` (all real `Dialog`-based overlays with a backdrop, meant to be dismissed): this
 * has no backdrop, no portal, and no scrim — the rest of the page stays fully visible and
 * interactive while it's open, exactly like a real Slack thread panel never dims the channel
 * behind it.
 *
 * Collapsing doesn't remove the panel entirely — it shrinks to a slim, always-present rail with
 * one toggle button, so there's always a way back in without the caller having to wire up its own
 * external "reopen" control (the same reasoning `SidebarNav`'s icon-only collapsed mode already
 * follows for the equivalent left-hand case). Same controlled/uncontrolled convention as every
 * other stateful component here (`open`/`defaultOpen`/`onOpenChange`).
 */
export function SidePanel({
  title,
  children,
  open,
  defaultOpen = true,
  onOpenChange,
  hideToggle = false,
  width = 320,
  className,
  style,
  ...props
}: SidePanelProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  if (!current) {
    return (
      <aside
        className={clsx("rebar-side-panel", "rebar-side-panel-collapsed", className)}
        data-rebar-component="side-panel"
        data-rebar-open="false"
        style={style}
        {...props}
      >
        {hideToggle ? null : (
          <button
            type="button"
            className="rebar-side-panel-toggle"
            data-rebar-part="toggle"
            aria-label={typeof title === "string" ? `Open ${title}` : "Open panel"}
            onClick={() => setOpen(true)}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={clsx("rebar-side-panel", className)}
      data-rebar-component="side-panel"
      data-rebar-open="true"
      style={{ width, ...style }}
      {...props}
    >
      {title || !hideToggle ? (
        <div className="rebar-side-panel-header" data-rebar-part="header">
          {title ? (
            <Heading level={3} style={{ margin: 0 }}>
              {title}
            </Heading>
          ) : (
            <span />
          )}
          {hideToggle ? null : (
            <button
              type="button"
              className="rebar-side-panel-close"
              data-rebar-part="close"
              aria-label={typeof title === "string" ? `Collapse ${title}` : "Collapse panel"}
              onClick={() => setOpen(false)}
            >
              <ChevronRightIcon aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}
      <div className="rebar-side-panel-content" data-rebar-part="content">
        {children}
      </div>
    </aside>
  );
}
