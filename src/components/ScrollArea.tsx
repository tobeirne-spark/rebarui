import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import clsx from "clsx";

export interface ScrollAreaProps extends ComponentPropsWithoutRef<"div"> {
  /** Caps the scroll area's height. A plain number is treated as px; a string is used as-is. */
  maxHeight?: number | string;
  /** Which axis gets the themed scrollbar + overflow:auto. Defaults to "vertical". */
  orientation?: "vertical" | "horizontal" | "both";
}

/**
 * A custom-styled scrollable container: real native scrolling (`overflow: auto`, never `hidden`,
 * on whichever axis is active — see ref/HEURISTICS.md #48/robot.md checklist item 5) with a
 * thinner, theme-aware scrollbar (`scrollbar-width`/`::-webkit-scrollbar`, no JS). Genuinely
 * CSS-only — plain `overflow` styling already solves this, so no scroll-primitive dependency is
 * pulled in for it.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { children, maxHeight, orientation = "vertical", className, style, ...props },
  ref,
) {
  const mergedStyle: CSSProperties = {
    ...style,
    ...(maxHeight !== undefined ? { maxHeight } : {}),
  };

  return (
    <div
      ref={ref}
      className={clsx("rebar-scroll-area", className)}
      data-rebar-component="scroll-area"
      data-rebar-orientation={orientation}
      style={mergedStyle}
      {...props}
    >
      {children}
    </div>
  );
});
