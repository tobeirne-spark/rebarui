import * as RadixHoverCard from "@radix-ui/react-hover-card";
import type { ReactElement, ReactNode } from "react";

export interface HoverCardProps {
  trigger: ReactElement;
  children: ReactNode;
  /** Delay (ms) before opening after the pointer enters the trigger. Radix default: 700. */
  openDelay?: number;
  /** Delay (ms) before closing after the pointer leaves both the trigger and the content — the
      grace period that lets a viewer move the pointer from one to the other without it
      vanishing mid-move. Radix default: 300. */
  closeDelay?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A distinct component from `Popover`, not a variant of it — genuinely different interaction
 * model. `Popover` is click-triggered and dismissed by an explicit click-outside or Escape, which
 * is correct for something the viewer deliberately opened (e.g. `NavBar`'s overflow menu — a
 * "More" button someone clicked should stay open until they're done with it, not vanish the
 * instant their pointer drifts off it). `HoverCard` opens on hover/focus and auto-dismisses a
 * short delay after the pointer leaves both trigger and content — the right choice for supplementary
 * content someone is previewing, not actively operating (a footnote, a preview thumbnail, extra
 * detail on a term). Picking the wrong one for a given case produces a real, opposite-direction
 * UX bug either way: a click-menu that vanishes on hover-loss is maddening to use with a mouse
 * that isn't perfectly steady; a hover-preview that requires a click to dismiss is one extra
 * interaction for content that was never meant to be "operated."
 */
export function HoverCard({
  trigger,
  children,
  openDelay,
  closeDelay,
  open,
  onOpenChange,
}: HoverCardProps) {
  return (
    <RadixHoverCard.Root
      open={open}
      onOpenChange={onOpenChange}
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      <RadixHoverCard.Trigger asChild>{trigger}</RadixHoverCard.Trigger>
      <RadixHoverCard.Portal>
        <RadixHoverCard.Content
          className="rebar-hover-card-content"
          data-rebar-component="hover-card"
          sideOffset={4}
        >
          {children}
          <RadixHoverCard.Arrow className="rebar-hover-card-arrow" />
        </RadixHoverCard.Content>
      </RadixHoverCard.Portal>
    </RadixHoverCard.Root>
  );
}
