import { forwardRef } from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import type { ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface CheckboxProps
  extends Omit<RadixCheckbox.CheckboxProps, "asChild"> {
  children?: ReactNode;
  /** Force bionic reading on/off for the label, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { className, children, bionic, bionicOptions, id, ...props },
  ref,
) {
  const generatedId = id ?? undefined;
  const label = useBionicChildren(children, bionic, bionicOptions);

  return (
    <label className="rebar-checkbox-label" htmlFor={generatedId}>
      <RadixCheckbox.Root
        ref={ref}
        id={generatedId}
        className={clsx("rebar-checkbox", className)}
        data-rebar-component="checkbox"
        {...props}
      >
        <RadixCheckbox.Indicator className="rebar-checkbox-indicator" data-rebar-part="indicator">
          ✓
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {children ? <span data-rebar-part="label">{label}</span> : null}
    </label>
  );
});
