import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

const SPACE_VAR: Record<NonNullable<StackProps["gap"]>, string> = {
  xs: "var(--rebar-space-xs, 4px)",
  sm: "var(--rebar-space-sm, 8px)",
  md: "var(--rebar-space-md, 16px)",
  lg: "var(--rebar-space-lg, 24px)",
  xl: "var(--rebar-space-xl, 32px)",
  "2xl": "var(--rebar-space-2xl, 48px)",
};

const JUSTIFY_VAR: Record<NonNullable<StackProps["justify"]>, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};

export interface StackProps extends ComponentPropsWithoutRef<"div"> {
  direction?: "row" | "column";
  gap?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = "column", gap = "md", align, justify, className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx("rebar-stack", className)}
      data-rebar-component="stack"
      data-rebar-direction={direction}
      style={{
        gap: SPACE_VAR[gap],
        alignItems: align,
        justifyContent: justify ? JUSTIFY_VAR[justify] : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
