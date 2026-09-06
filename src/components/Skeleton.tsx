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
      >
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={clsx("rebar-skeleton-line", active && "rebar-skeleton-active")}
            data-rebar-part="line"
            style={i === lines - 1 && lines > 1 ? { width: "60%" } : undefined}
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
