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
  /** Overrides the indicator's content entirely — a plain emoji character (e.g. `"🔥"`) or a small
   * icon element, instead of a numeric count. Deliberately not a separate "emoji mode": any small
   * glyph — emoji, a RemixIcon from `icons.tsx`, or a count — is just content the same indicator
   * shell renders, per ref/TOM.md 1.4/Badge's own note once the project had a real icon system.
   * Takes priority over `count`/`dot` when supplied, and (unlike a count) shows regardless of
   * `showZero` — there's no "zero" concept for a decorative glyph. */
  content?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { count, max = 99, dot, tone = "error", showZero, content, children, className },
  ref,
) {
  const hasCount = typeof count === "number";
  const hasContent = content !== undefined;
  const visible = hasContent || dot || (hasCount && (count > 0 || showZero));
  const label = hasCount && count > max ? `${max}+` : String(count ?? "");
  const indicatorContent = hasContent ? content : dot ? null : label;

  if (!children) {
    // Standalone badge — just the indicator, no wrapped content to position it against.
    return visible ? (
      <span
        ref={ref}
        className={clsx("rebar-badge-indicator", dot && "rebar-badge-dot", className)}
        data-rebar-component="badge"
        data-rebar-tone={tone}
      >
        {indicatorContent}
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
          {indicatorContent}
        </span>
      ) : null}
    </span>
  );
});
