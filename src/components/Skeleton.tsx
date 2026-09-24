import { forwardRef } from "react";
import clsx from "clsx";

export type SkeletonVariant = "text" | "avatar" | "button" | "rect";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  active?: boolean;
  lines?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = "text", active = true, lines = 3, width, height, className },
  ref,
) {
  if (variant === "text") {
    return (
      <div
        ref={ref}
        className={clsx("rebar-skeleton-group", className)}
        data-rebar-component="skeleton"
        data-rebar-variant="text"
        aria-hidden="true"
        // `width` constrains the group as a whole (each line's own CSS default is width: 100% of
        // its parent) rather than each individual line -- a caller asking for one short line
        // (`lines={1}`) wants *that* narrower, not a full-width line inside a narrower box.
        style={width !== undefined ? { width } : undefined}
      >
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={clsx("rebar-skeleton-line", active && "rebar-skeleton-active")}
            data-rebar-part="line"
            style={{
              // The last of several lines is deliberately shorter, mimicking a paragraph's ragged
              // final line -- moot (and skipped) for a single line, which is never "the last of
              // several".
              ...(i === lines - 1 && lines > 1 ? { width: "60%" } : undefined),
              ...(height !== undefined ? { height } : undefined),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      ref={ref}
      className={clsx(
        "rebar-skeleton",
        `rebar-skeleton-${variant}`,
        active && "rebar-skeleton-active",
        className,
      )}
      data-rebar-component="skeleton"
      data-rebar-variant={variant}
      aria-hidden="true"
      style={{ width, height }}
    />
  );
});
