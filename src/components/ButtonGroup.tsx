import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface ButtonGroupProps extends ComponentPropsWithoutRef<"div"> {
  /** Real `Button` elements — this component only supplies the visual joining, never a
   * data-driven `items` array (that's `SplitButton`'s job for a primary+secondary-actions shape,
   * or a plain `.map()` for anything else). */
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
}

/**
 * A visually joined row (or column) of several equal `Button`s — double borders between
 * adjacent buttons collapsed and inner corners squared off via CSS only (`> :first-child` /
 * `> :last-child` selectors keyed off `data-rebar-orientation`), no props read from or forwarded
 * to the children themselves.
 *
 * Distinct from `SplitButton`: `SplitButton` pairs one primary action with a dropdown of
 * secondary ones (a `Popover` menu); `ButtonGroup` is several equal, always-visible actions with
 * no menu at all.
 *
 * No `size`/`variant` props: unlike `AvatarGroup` (which constructs every `Avatar` itself from a
 * plain data array, so forwarding `size` to each one is just a normal prop pass in code this
 * component owns), `ButtonGroup` receives arbitrary already-built `Button` elements as
 * `children` it never constructs. Propagating `size`/`variant` here would mean `cloneElement`
 * over arbitrary children — fragile for a component that doesn't control what's inside it: a
 * child might not be a `Button` at all (a wrapped custom element, a conditionally-rendered
 * `null`, a `Fragment`), in which case cloning props onto it either silently does nothing or
 * lands on the wrong element, and even when every child genuinely is a `Button`, silently
 * overriding a size/variant the caller explicitly set on one child (e.g. a lone tertiary
 * "more actions" button beside otherwise-primary ones — a real, legitimate use of a button
 * group) is a surprising, hard-to-trace behavior. `Button`'s own `size`/`variant` props already
 * exist and read clearly set directly on each child; this component doesn't duplicate that
 * surface.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { children, orientation = "horizontal", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      className={clsx("rebar-button-group", className)}
      data-rebar-component="button-group"
      data-rebar-orientation={orientation}
      {...props}
    >
      {children}
    </div>
  );
});
