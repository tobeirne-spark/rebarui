import { forwardRef } from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import clsx from "clsx";

export type SwitchProps = RadixSwitch.SwitchProps;

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, ...props },
  ref,
) {
  return (
    <RadixSwitch.Root
      ref={ref}
      className={clsx("rebar-switch", className)}
      data-rebar-component="switch"
      {...props}
    >
      <RadixSwitch.Thumb className="rebar-switch-thumb" data-rebar-part="thumb" />
    </RadixSwitch.Root>
  );
});
