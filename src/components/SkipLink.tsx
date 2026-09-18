import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface SkipLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href" | "children"> {
  /** The `id` of the main content landmark to jump to (no leading `#`). Defaults to
   * `"main-content"` — give your page's main region that `id`, or pass a different one here. */
  targetId?: string;
  children?: ReactNode;
}

/**
 * "Skip to main content" — the standard first-focusable-element pattern (GOV.UK Design System,
 * Carbon, and most serious accessibility-focused systems ship one explicitly) letting a keyboard
 * user jump straight past repeated site chrome (a nav bar, a sidebar) into the real content,
 * instead of tabbing through every nav item on every single page load. Off-screen until focused,
 * then a real, visible, first-in-tab-order link — never removed from the layout or the tab order,
 * just visually hidden until it's relevant.
 */
export function SkipLink({ targetId = "main-content", children, className, ...props }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={clsx("rebar-skip-link", className)}
      data-rebar-component="skip-link"
      {...props}
    >
      {children ?? "Skip to main content"}
    </a>
  );
}
