import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface AlertProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  type?: "info" | "success" | "warning" | "error";
  title?: ReactNode;
  children?: ReactNode;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { type = "info", title, className, children, bionic, bionicOptions, ...props },
  ref,
) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const bodyContent = useBionicChildren(children, bionic, bionicOptions);
  return (
    <div
      ref={ref}
      className={clsx("rebar-alert", className)}
      data-rebar-component="alert"
      data-rebar-type={type}
      role={type === "error" || type === "warning" ? "alert" : "status"}
      {...props}
    >
      {title ? (
        <span className="rebar-alert-title" data-rebar-part="title">
          {titleContent}
        </span>
      ) : null}
      {children ? (
        <div data-rebar-part="description">{bodyContent}</div>
      ) : null}
    </div>
  );
});
