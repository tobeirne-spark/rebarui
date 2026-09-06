import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface TextProps extends ComponentPropsWithoutRef<"p"> {
  as?: ElementType;
  size?: "xs" | "sm" | "md";
  color?: "primary" | "secondary";
  children?: ReactNode;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  { as: Component = "p", size = "md", color = "primary", className, children, bionic, bionicOptions, ...props },
  ref,
) {
  const content = useBionicChildren(children, bionic, bionicOptions);
  return (
    <Component
      ref={ref}
      className={clsx("rebar-text", className)}
      data-rebar-component="text"
      data-rebar-size={size}
      data-rebar-color={color}
      {...props}
    >
      {content}
    </Component>
  );
});
