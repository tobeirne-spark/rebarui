import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface HeadingProps extends ComponentPropsWithoutRef<"h1"> {
  level?: 1 | 2 | 3;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 1, className, children, bionic, bionicOptions, ...props },
  ref,
) {
  const Component = `h${level}` as "h1" | "h2" | "h3";
  const content = useBionicChildren(children, bionic, bionicOptions);
  return (
    <Component
      ref={ref}
      className={clsx("rebar-heading", className)}
      data-rebar-component="heading"
      data-rebar-level={level}
      {...props}
    >
      {content}
    </Component>
  );
});
