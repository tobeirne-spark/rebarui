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
          {/* Radix renders this Indicator for both "checked" and "indeterminate" `data-state` —
              picking the right glyph via CSS (keyed off the real `data-state` Radix itself sets)
              rather than inspecting the `checked` prop in JS means this works whether the caller
              drives `checked`/`defaultChecked` in controlled or uncontrolled mode. Previously
              always rendered "✓" regardless of state, and with no `data-state="indeterminate"`
              CSS rule for a colored background either, an indeterminate checkbox (e.g. Table's own
              partial-selection "select all") rendered a real, invisible white-on-white checkmark —
              silently broken, not just visually plain. */}
          <span className="rebar-checkbox-icon-checked" aria-hidden="true">
            ✓
          </span>
          <span className="rebar-checkbox-icon-indeterminate" aria-hidden="true">
            −
          </span>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {children ? <span data-rebar-part="label">{label}</span> : null}
    </label>
  );
});
