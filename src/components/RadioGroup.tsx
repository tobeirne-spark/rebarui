import { forwardRef } from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import type { ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export type RadioGroupProps = RadixRadioGroup.RadioGroupProps;

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { className, ...props },
  ref,
) {
  return (
    <RadixRadioGroup.Root
      ref={ref}
      className={clsx("rebar-radio-group", className)}
      data-rebar-component="radio-group"
      {...props}
    />
  );
});

export interface RadioProps extends Omit<RadixRadioGroup.RadioGroupItemProps, "asChild"> {
  children?: ReactNode;
  /** Force bionic reading on/off for the label, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export const Radio = forwardRef<HTMLButtonElement, RadioProps>(function Radio(
  { className, children, bionic, bionicOptions, id, ...props },
  ref,
) {
  const label = useBionicChildren(children, bionic, bionicOptions);
  return (
    <label className="rebar-radio-label" htmlFor={id}>
      <RadixRadioGroup.Item
        ref={ref}
        id={id}
        className={clsx("rebar-radio", className)}
        data-rebar-component="radio"
        {...props}
      >
        <RadixRadioGroup.Indicator className="rebar-radio-indicator" data-rebar-part="indicator" />
      </RadixRadioGroup.Item>
      {children ? <span data-rebar-part="label">{label}</span> : null}
    </label>
  );
});
