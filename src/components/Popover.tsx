import * as RadixPopover from "@radix-ui/react-popover";
import type { ReactElement, ReactNode } from "react";

export interface PopoverProps {
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sideOffset?: number;
  contentProps?: Record<string, unknown>;
}

export function Popover({ trigger, children, open, onOpenChange, sideOffset = 4, contentProps }: PopoverProps) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          className="rebar-popover-content"
          data-rebar-component="popover"
          sideOffset={sideOffset}
          {...contentProps}
        >
          {children}
          <RadixPopover.Arrow className="rebar-popover-arrow" />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
