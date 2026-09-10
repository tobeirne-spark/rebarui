import { forwardRef, useId, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import { ChevronDownIcon } from "./icons";
import type { BionicOptions } from "../bionic";

export interface CollapsibleProps extends ComponentPropsWithoutRef<"div"> {
  /** Controlled open state. Omit to let Collapsible manage its own state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Ignored once `open` is passed. */
  defaultOpen?: boolean;
  /** Fires whenever the trigger is clicked. In controlled mode the caller must apply the next
   * value back via `open` for the panel to actually change — Collapsible never assumes it. */
  onOpenChange?: (open: boolean) => void;
  /** The clickable header — a real `<button>` under the hood, not a styled `<div>`. */
  trigger: ReactNode;
  /** The collapsible content region. */
  children: ReactNode;
  /** Prevents the trigger from toggling the panel. */
  disabled?: boolean;
  /** Force bionic reading on/off for the trigger text, overriding the ambient data-rebar-bionic
   * setting — same convention as `Button`. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/**
 * A single expand/collapse region — the lone-panel counterpart to `Accordion`/`AccordionItem`,
 * for a "Show more" panel or a filter drawer where a `value`-keyed multi-item structure would be
 * unnecessary overhead. Mirrors `AccordionItem`'s visual language (disclosure chevron that rotates
 * 180deg open, same trigger padding/min-height, instant show/hide with no measured-height
 * animation, content fully removed from the DOM when collapsed rather than merely hidden) so it
 * reads as the same interaction pattern, just without Radix's Accordion primitive (a single
 * on/off toggle needs no complex interaction logic — plain semantic HTML plus real
 * aria-expanded/aria-controls is enough; see robot.md checklist item 3).
 */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  { open, defaultOpen, onOpenChange, trigger, children, disabled, className, bionic, bionicOptions, ...rest },
  ref,
) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? open : internalOpen;
  const triggerContent = useBionicChildren(trigger, bionic, bionicOptions);

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const contentId = useId();
  const triggerId = useId();

  const handleTriggerClick = () => {
    if (disabled) return;
    setOpen(!currentOpen);
  };

  return (
    <div
      ref={ref}
      className={clsx("rebar-collapsible", className)}
      data-rebar-component="collapsible"
      data-rebar-open={currentOpen || undefined}
      {...rest}
    >
      <button
        type="button"
        id={triggerId}
        className="rebar-collapsible-trigger"
        data-rebar-part="trigger"
        data-rebar-open={currentOpen || undefined}
        aria-expanded={currentOpen}
        aria-controls={contentId}
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        {triggerContent}
        <span className="rebar-collapsible-icon" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>
      {currentOpen ? (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          className="rebar-collapsible-content"
          data-rebar-part="content"
          data-rebar-open
        >
          {children}
        </div>
      ) : null}
    </div>
  );
});
