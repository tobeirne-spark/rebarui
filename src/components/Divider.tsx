import { forwardRef } from "react";
import * as RadixSeparator from "@radix-ui/react-separator";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface DividerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  orientation?: "horizontal" | "vertical";
  children?: ReactNode;
  className?: string;
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = "horizontal", children, className, ...props },
  ref,
) {
  if (children) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={clsx("rebar-divider", "rebar-divider-with-text", className)}
        data-rebar-component="divider"
        {...props}
      >
        <span className="rebar-divider-line" data-rebar-part="line" />
        <span className="rebar-divider-text" data-rebar-part="text">
          {children}
        </span>
        <span className="rebar-divider-line" data-rebar-part="line" />
      </div>
    );
  }

  return (
    <RadixSeparator.Root
      ref={ref}
      orientation={orientation}
      className={clsx("rebar-divider", className)}
      data-rebar-component="divider"
      {...props}
    />
  );
});
