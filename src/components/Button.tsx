import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  variant?: "primary" | "secondary" | "tertiary" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children?: ReactNode;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    bionic,
    bionicOptions,
    type = "button",
    ...props
  },
  ref,
) {
  const content = useBionicChildren(children, bionic, bionicOptions);
  return (
    <button
      ref={ref}
      type={type}
      className={clsx("rebar-button", className)}
      data-rebar-component="button"
      data-rebar-variant={variant}
      data-rebar-size={size}
      data-rebar-state={loading ? "loading" : "idle"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span aria-hidden="true">⏳</span> : null}
      {content}
    </button>
  );
});
