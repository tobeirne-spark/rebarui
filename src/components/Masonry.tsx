import { Children } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface MasonryProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children: ReactNode;
  /** Number of columns. Default 3. */
  columns?: number;
  /** Gap between items, in px (applied both between columns and between stacked items within a
   * column). Default 16. */
  gap?: number;
}

/**
 * A Pinterest-style waterfall grid: items of varying height packed into balanced columns, rather
 * than a fixed-row grid where every row's height is dictated by its tallest item.
 *
 * Implementation choice, stated: pure CSS columns (`column-count`/`column-gap`, each child given
 * `break-inside: avoid`) rather than a JS height-measuring column-balancing algorithm. This is a
 * real, well-established CSS-only masonry technique — genuinely simpler, and just as correct as a
 * JS-measured approach for the common case, with no `ResizeObserver`/layout-effect pass needed and
 * correct output on the very first paint (including SSR).
 *
 * The one real, honest tradeoff: CSS columns fills a column top-to-bottom *before* wrapping to the
 * next one, so item order reads top-to-bottom-then-left-to-right — not the "shortest column gets
 * the next item" true masonry algorithm some JS-based libraries (e.g. a height-measuring virtual
 * layout) use to keep column heights closely balanced. For most content (a gallery, a card feed)
 * this reads the same to a viewer; a caller that specifically needs columns kept height-balanced
 * (not just non-overlapping) needs a JS-measured layout instead, which this component deliberately
 * doesn't attempt.
 */
export function Masonry({ children, columns = 3, gap = 16, className, style, ...props }: MasonryProps) {
  const items = Children.toArray(children);

  return (
    <div
      className={clsx("rebar-masonry", className)}
      data-rebar-component="masonry"
      style={{
        columnCount: columns,
        columnGap: gap,
        ...style,
      }}
      {...props}
    >
      {items.map((child, i) => (
        <div
          key={i}
          className="rebar-masonry-item"
          data-rebar-part="item"
          style={{ breakInside: "avoid", marginBottom: gap }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
