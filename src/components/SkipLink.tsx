import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import clsx from "clsx";

export interface SkipLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href" | "children"> {
  /** The `id` of the main content landmark to jump to (no leading `#`). Defaults to
   * `"main-content"` — give your page's main region that `id`, or pass a different one here. */
  targetId?: string;
  children?: ReactNode;
}

// The browser's own native anchor-jump scrolls the target flush to the very top edge of the
// viewport — a hard, disorienting cut rather than a comfortable landing spot, especially right
// after a big context switch like "skip past the entire nav." Landing it roughly a third of the
// way down instead reads as arriving somewhere, not being clipped at an edge.
const TARGET_VIEWPORT_FRACTION = 1 / 3;

// A skip-link target usually isn't itself focusable (a plain `<main>`, not a button/input) — the
// browser's native fragment-navigation focus only fires for its own default jump, not for a
// manual `element.focus()` call, which strictly requires a real tabindex. Add one temporarily
// (the standard, widely-used pattern for exactly this) and remove it again once focus leaves, so
// the target doesn't permanently become part of the page's tab order.
function focusAndScrollToTarget(targetId: string): boolean {
  const target = document.getElementById(targetId);
  if (!target) return false;
  const hadTabIndex = target.hasAttribute("tabindex");
  if (!hadTabIndex) {
    target.setAttribute("tabindex", "-1");
    const restore = () => {
      target.removeAttribute("tabindex");
      target.removeEventListener("blur", restore);
    };
    target.addEventListener("blur", restore, { once: true });
  }
  const top = window.scrollY + target.getBoundingClientRect().top - window.innerHeight * TARGET_VIEWPORT_FRACTION;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  target.focus({ preventScroll: true });
  return true;
}

/**
 * "Skip to main content" — the standard first-focusable-element pattern (GOV.UK Design System,
 * Carbon, and most serious accessibility-focused systems ship one explicitly) letting a keyboard
 * user jump straight past repeated site chrome (a nav bar, a sidebar) into the real content,
 * instead of tabbing through every nav item on every single page load. Off-screen until focused,
 * then a real, visible, first-in-tab-order link — never removed from the layout or the tab order,
 * just visually hidden until it's relevant.
 */
export function SkipLink({ targetId = "main-content", children, className, onClick, ...props }: SkipLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Falls through to the browser's own native anchor jump if the target isn't in the DOM yet
    // (e.g. rendered async) — a real jump beats a click that silently does nothing.
    if (focusAndScrollToTarget(targetId)) {
      event.preventDefault();
      history.pushState(null, "", `#${targetId}`);
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className={clsx("rebar-skip-link", className)}
      data-rebar-component="skip-link"
      onClick={handleClick}
      {...props}
    >
      {children ?? "Skip to main content"}
    </a>
  );
}
