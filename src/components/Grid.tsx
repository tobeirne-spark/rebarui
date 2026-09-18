import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import clsx from "clsx";

const SPACE_VAR = {
  xs: "var(--rebar-space-xs, 4px)",
  sm: "var(--rebar-space-sm, 8px)",
  md: "var(--rebar-space-md, 16px)",
  lg: "var(--rebar-space-lg, 24px)",
  xl: "var(--rebar-space-xl, 32px)",
  "2xl": "var(--rebar-space-2xl, 48px)",
} as const;

export interface GridProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
  children?: ReactNode;
  gap?: keyof typeof SPACE_VAR;
  /** Fixed column count — every column an equal fraction of the row, no reflow at any width.
   * Mutually exclusive with `minItemWidth`; set one or the other, not both. */
  columns?: number;
  /** Minimum width per item before the row drops a column — real CSS `repeat(auto-fit,
   * minmax(...))`, so the grid reflows down toward one column on a narrow viewport with no
   * breakpoint prop or JS measurement required. The default strategy when `columns` is unset. */
  minItemWidth?: number | string;
}

/**
 * A general responsive column grid — distinct from `Stack`'s flexbox row/column model, and from
 * the placement layer's own fixed-purpose `card-grid`/`feature-grid`/`pillar-grid` blocks (each
 * shaped for one specific content type, not a primitive a caller lays arbitrary content into).
 * Defaults to the auto-fit/minmax strategy (`minItemWidth`) rather than a fixed `columns` count,
 * since that's the one that needs zero extra configuration to already be responsive.
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { as: Component = "div", className, children, gap = "md", columns, minItemWidth = 240, style, ...props },
  ref,
) {
  const gridTemplateColumns =
    columns !== undefined
      ? `repeat(${columns}, 1fr)`
      : `repeat(auto-fit, minmax(${typeof minItemWidth === "number" ? `${minItemWidth}px` : minItemWidth}, 1fr))`;

  return (
    <Component
      ref={ref}
      className={clsx("rebar-grid", className)}
      data-rebar-component="grid"
      style={{
        display: "grid",
        gridTemplateColumns,
        gap: SPACE_VAR[gap],
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});
