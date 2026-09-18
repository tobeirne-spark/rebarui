import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import clsx from "clsx";

export type ContainerMaxWidth = "sm" | "md" | "lg" | "xl" | "full";

const MAX_WIDTH_PX: Record<Exclude<ContainerMaxWidth, "full">, number> = {
  sm: 480,
  md: 640,
  lg: 800,
  xl: 1040,
};

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
  children?: ReactNode;
  /** Named breakpoint (`"lg"` = 800px, matching this project's own docs pages before this
   * component existed) or a literal CSS width (`number` = px, or any CSS length string).
   * `"full"` removes the constraint entirely — same as omitting `maxWidth`, spelled out for
   * clarity when toggling it per-instance. Defaults to `"lg"`. */
  maxWidth?: ContainerMaxWidth | number | string;
  /** Horizontal padding, so content never touches the viewport edge on narrow screens even once
   * `maxWidth` stops constraining it. Defaults to `var(--rebar-space-xl)`. */
  padding?: string;
}

/**
 * Centers and width-constrains page content — the one job every bare (no sidebar layout) content
 * page on this project's own docs site kept hand-rolling as an identical inline style
 * (`maxWidth: 800, margin: "0 auto", padding: "var(--rebar-space-xl)"`) before this existed. Real
 * page-level governance (how wide can content get, how is it centered), the same Order-tier role
 * `AppShell`/`SidebarNav` already play for navigation — see ref/TIERS.md.
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { as: Component = "div", className, children, maxWidth = "lg", padding = "var(--rebar-space-xl)", style, ...props },
  ref,
) {
  const resolvedMaxWidth =
    maxWidth === "full"
      ? undefined
      : typeof maxWidth === "number"
        ? `${maxWidth}px`
        : maxWidth in MAX_WIDTH_PX
          ? `${MAX_WIDTH_PX[maxWidth as Exclude<ContainerMaxWidth, "full">]}px`
          : maxWidth;

  return (
    <Component
      ref={ref}
      className={clsx("rebar-container", className)}
      data-rebar-component="container"
      style={{
        maxWidth: resolvedMaxWidth,
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: padding,
        paddingRight: padding,
        boxSizing: "border-box",
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});
