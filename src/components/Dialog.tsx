import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Heading } from "./Heading";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Force bionic reading on/off for the title/description, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  /** An animated light beam traveling around the dialog's edge — the same drop-target signal
   * `Card`/`Kanban` use (see ref/HEURISTICS.md #47); makes sense here for a modal a drag can be
   * dropped onto (e.g. "drop here to attach"), not for an ordinary modal. */
  activeBorder?: boolean;
  /** Closes the dialog on its own after this many milliseconds of being open — for a transient
   * confirmation, not a modal the user needs to act on. Restarts if the dialog closes and reopens. */
  autoDismiss?: number;
  /** Fills the entire viewport — no dimmed backdrop margin around it, since there's no dead space
   * left to show one in. For a modal that genuinely needs the whole screen (an image viewer, a
   * focused editing flow), not the default "centered card over a dimmed page" shape. */
  fullscreen?: boolean;
}

export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  bionic,
  bionicOptions,
  className,
  activeBorder,
  autoDismiss,
  fullscreen,
}: DialogProps) {
  const descriptionContent = useBionicChildren(description, bionic, bionicOptions);
  // Managed internally regardless of controlled/uncontrolled usage, so autoDismiss has a real
  // "close myself" mechanism to call even when the caller never passed `open` — the same
  // "controlled if provided, otherwise self-managed" pattern used throughout this library.
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!autoDismiss || !currentOpen) return;
    const timer = setTimeout(() => handleOpenChange(false), autoDismiss);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismiss, currentOpen]);

  return (
    <RadixDialog.Root open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={clsx("rebar-dialog-overlay", fullscreen && "rebar-dialog-overlay-fullscreen")}
          data-rebar-part="overlay"
        />
        <RadixDialog.Content
          className={clsx(
            "rebar-dialog-content",
            fullscreen && "rebar-dialog-content-fullscreen",
            activeBorder && "rebar-active-border",
            className,
          )}
          data-rebar-component="dialog"
          aria-modal="true"
        >
          <div className="rebar-dialog-header">
            <RadixDialog.Title asChild>
              <Heading level={2} data-rebar-part="title" bionic={bionic} bionicOptions={bionicOptions}>
                {title}
              </Heading>
            </RadixDialog.Title>
            <RadixDialog.Close
              className="rebar-dialog-close"
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
              {descriptionContent}
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
