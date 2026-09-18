import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

const SPACE_VAR = {
  xs: "var(--rebar-space-xs, 4px)",
  sm: "var(--rebar-space-sm, 8px)",
  md: "var(--rebar-space-md, 16px)",
  lg: "var(--rebar-space-lg, 24px)",
  xl: "var(--rebar-space-xl, 32px)",
  "2xl": "var(--rebar-space-2xl, 48px)",
} as const;

export interface RowProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
  /** Gap between columns — same token convention as `Stack`/`Grid`. Defaults to `"md"`. */
  gutter?: keyof typeof SPACE_VAR;
}

export interface ColProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
  /** How many of the row's 24 units this column spans. Defaults to `24` (full width). */
  span?: number;
  /** This column's absolute starting position in the row's 24-unit track (an offset of `6` means
   * "start at unit 7"), not additional space relative to auto-flow position — simpler than AntD's
   * own relative offset, at the cost of needing the caller to account for earlier siblings' spans
   * when combining `offset` with more than one column in the same row. Defaults to `0`, which
   * leaves this column's position to CSS Grid's own auto-placement (the common case: sequential
   * `<Col>`s with no `offset` simply sit side by side). */
  offset?: number;
}

/**
 * A fixed 24-unit span grid — `Row` establishes the 24-column track, `Col` claims a `span` of it
 * (and an optional `offset`). Distinct from `Grid` (which is either a fixed equal-width `columns`
 * count or a responsive `minItemWidth` reflow, with no per-item span control): `Row`/`Col` is for
 * an *asymmetric* layout — a 16/8 split, a 6/12/6 split — the same mental model AntD's own
 * `Row`/`Col` and Bootstrap's grid both use. Reach for `Grid` first for a uniform card/tile
 * layout; reach for `Row`/`Col` when different regions need deliberately different widths.
 */
export const Row = forwardRef<HTMLDivElement, RowProps>(function Row(
  { children, gutter = "md", className, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx("rebar-row", className)}
      data-rebar-component="row"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(24, 1fr)",
        gap: SPACE_VAR[gutter],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

export const Col = forwardRef<HTMLDivElement, ColProps>(function Col(
  { children, span = 24, offset = 0, className, style, ...props },
  ref,
) {
  // No offset: `span N` alone lets CSS Grid auto-place this column in the next open slot of the
  // current row — what makes plain sequential `<Col>`s sit side by side with no positioning math.
  // An explicit start line (`${offset + 1} / span N`) is only used once an offset is requested,
  // since specifying a start line unconditionally (even a literal "column 1") would make every
  // unoffset `<Col>` overlap at the row's start instead of auto-flowing after its siblings.
  const gridColumn = offset > 0 ? `${offset + 1} / span ${span}` : `span ${span}`;
  return (
    <div
      ref={ref}
      className={clsx("rebar-col", className)}
      data-rebar-component="col"
      style={{ gridColumn, minWidth: 0, ...style }}
      {...props}
    >
      {children}
    </div>
  );
});
