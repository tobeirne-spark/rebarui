import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Spin } from "./Spin";
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
      {/* "classic" (a plain vector spinner using stroke="currentColor") inherits this button's
         own already-variant-aware text color — the real fix for every variant/theme combination
         at once, rather than a light/dark illustrated asset pre-selected against the *page's*
         theme, which can mismatch a button whose own background doesn't follow the page (e.g. a
         colored "primary"/"destructive" button in light mode still needs light text on a dark
         surface). Spin's own `role="status"` announces the loading state, same as `aria-busy`
         on the button itself. */}
      {loading ? <Spin spinning size={size} variant="classic" className="rebar-button-spinner" /> : null}
      {content}
    </button>
  );
});
