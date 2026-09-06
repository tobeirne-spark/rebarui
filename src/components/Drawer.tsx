import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useState } from "react";
import clsx from "clsx";
import { Heading } from "./Heading";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Which screen edge the panel slides in from. Defaults to "right". */
  side?: DrawerSide;
  /** The panel's width in px for left/right, height in px for top/bottom. Defaults to 360. */
  size?: number;
}

/**
 * Shared plumbing between `Drawer` and the components built directly on top of it
 * (`BottomSheet`, `ActionSheet`) — the exact same Radix wiring and controlled/uncontrolled
 * open-state pattern `Dialog` uses, just positioned/animated as a slide-in panel instead of a
 * centered box. Not part of the public component catalog itself (kept out of index.ts by
 * whoever wires that up) — a same-directory implementation detail so BottomSheet/ActionSheet can
 * reuse this without reimplementing it, each supplying their own `dataComponent` (so the DOM
 * still carries the correct, component-specific `data-rebar-component`) and optional extra
 * `handle` content (BottomSheet/ActionSheet's decorative drag handle).
 */
export interface DrawerPanelProps extends DrawerProps {
  dataComponent: string;
  /** Extra content rendered inside the panel, above the header — e.g. a decorative drag handle. */
  handle?: ReactNode;
}

function defaultAccessibleLabel(dataComponent: string) {
  const spaced = dataComponent.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function DrawerPanel({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
  side = "right",
  size = 360,
  dataComponent,
  handle,
}: DrawerPanelProps) {
  // Same controlled/uncontrolled pattern as Dialog: internally managed regardless of whether the
  // caller passes `open`, so every consumer (a plain uncontrolled trigger, or ActionSheet forcing
  // itself closed after a selection) works the same way.
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const isHorizontal = side === "left" || side === "right";
  const sizeStyle = isHorizontal ? { width: size } : { height: size };
  const hasVisibleTitle = title !== undefined && title !== null && title !== "";

  return (
    <RadixDialog.Root open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="rebar-dialog-overlay" data-rebar-part="overlay" />
        <RadixDialog.Content
          className={clsx("rebar-drawer-content", `rebar-drawer-content-${side}`, className)}
          data-rebar-component={dataComponent}
          data-rebar-side={side}
          style={sizeStyle}
          aria-modal="true"
        >
          {handle}
          <div className="rebar-dialog-header" data-rebar-part="header">
            <RadixDialog.Title asChild>
              <Heading
                level={2}
                data-rebar-part="title"
                className={hasVisibleTitle ? undefined : "rebar-visually-hidden"}
              >
                {hasVisibleTitle ? title : defaultAccessibleLabel(dataComponent)}
              </Heading>
            </RadixDialog.Title>
            <RadixDialog.Close
              className="rebar-drawer-close"
              data-rebar-part="close"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </RadixDialog.Close>
          </div>
          {description ? (
            <RadixDialog.Description data-rebar-part="description">
              {description}
            </RadixDialog.Description>
          ) : null}
          <div className="rebar-dialog-body" data-rebar-part="body">
            {children}
          </div>
          {footer ? (
            <div className="rebar-dialog-footer" data-rebar-part="footer">
              {footer}
            </div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/**
 * A panel that slides in from a screen edge — built on the same Radix Dialog primitive as
 * `Dialog` (same accessible modal semantics: focus trap, Esc to close, backdrop), just
 * positioned/animated as a slide-in panel instead of a centered box. Distinct from `Dialog`
 * (centered modal) the way a native app's side panel differs from an alert.
 *
 * Always includes a visible close button (the non-drag-to-dismiss fallback per
 * ref/HEURISTICS.md #38) in addition to Esc and backdrop-click dismissal.
 */
export function Drawer(props: DrawerProps) {
  return <DrawerPanel {...props} dataComponent="drawer" />;
}
