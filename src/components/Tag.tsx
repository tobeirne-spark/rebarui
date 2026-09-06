import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export type TagTone = "default" | "info" | "success" | "warning" | "error";

export interface TagProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  tone?: TagTone;
  closable?: boolean;
  onClose?: () => void;
  children?: ReactNode;
  /** Force bionic reading on/off for this instance, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { tone = "default", closable, onClose, children, bionic, bionicOptions, className, ...props },
  ref,
) {
  const content = useBionicChildren(children, bionic, bionicOptions);
  return (
    <span
      ref={ref}
      className={clsx("rebar-tag", className)}
      data-rebar-component="tag"
      data-rebar-tone={tone}
      {...props}
    >
      <span data-rebar-part="label">{content}</span>
      {closable ? (
        <button
          type="button"
          className="rebar-tag-close"
          data-rebar-part="close"
          aria-label="Remove"
          onClick={onClose}
        >
          ×
        </button>
      ) : null}
    </span>
  );
});
