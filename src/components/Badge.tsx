import { forwardRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

export type BadgeTone = "default" | "info" | "success" | "warning" | "error";

export interface BadgeProps {
  count?: number;
  max?: number;
  dot?: boolean;
  tone?: BadgeTone;
  showZero?: boolean;
  children?: ReactNode;
  className?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { count, max = 99, dot, tone = "error", showZero, children, className },
  ref,
) {
  const hasCount = typeof count === "number";
  const visible = dot || (hasCount && (count > 0 || showZero));
  const label = hasCount && count > max ? `${max}+` : String(count ?? "");

  if (!children) {
    // Standalone badge — just the indicator, no wrapped content to position it against.
    return visible ? (
      <span
        ref={ref}
        className={clsx("rebar-badge-indicator", dot && "rebar-badge-dot", className)}
        data-rebar-component="badge"
        data-rebar-tone={tone}
      >
        {dot ? null : label}
      </span>
    ) : null;
  }

  return (
    <span ref={ref} className={clsx("rebar-badge", className)} data-rebar-component="badge">
      {children}
      {visible ? (
        <span
          className={clsx("rebar-badge-indicator", dot && "rebar-badge-dot")}
          data-rebar-part="indicator"
          data-rebar-tone={tone}
        >
          {dot ? null : label}
        </span>
      ) : null}
    </span>
  );
});
