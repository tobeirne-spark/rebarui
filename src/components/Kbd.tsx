import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface KbdProps extends ComponentPropsWithoutRef<"kbd"> {
  children: ReactNode;
}

/**
 * A keyboard-shortcut chip (e.g. "⌘K") — a real semantic `<kbd>` element, standalone, no
 * composition, no state. `CommandPalette`'s own `shortcut` field currently renders as a plain
 * unstyled span; this is the dedicated primitive that gap was missing.
 */
export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd className={clsx("rebar-kbd", className)} data-rebar-component="kbd" {...props}>
      {children}
    </kbd>
  );
}
