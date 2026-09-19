import { forwardRef } from "react";
import type { ReactNode } from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import clsx from "clsx";

export interface SwitchProps extends RadixSwitch.SwitchProps {
  /** Rendered inside the thumb itself (a sun/moon glyph for a light/dark toggle, say) — a plain
   * `ReactNode` slot, not a prescribed icon set, the same "bring your own icon" convention this
   * library's other icon slots already use. Absent by default (a bare thumb, unchanged). */
  thumbIcon?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, thumbIcon, ...props },
  ref,
) {
  return (
    <RadixSwitch.Root
      ref={ref}
      className={clsx("rebar-switch", thumbIcon && "rebar-switch-has-thumb-icon", className)}
      data-rebar-component="switch"
      {...props}
    >
      <RadixSwitch.Thumb className="rebar-switch-thumb" data-rebar-part="thumb">
        {thumbIcon ? (
          <span className="rebar-switch-thumb-icon" data-rebar-part="thumb-icon" aria-hidden="true">
            {thumbIcon}
          </span>
        ) : null}
      </RadixSwitch.Thumb>
    </RadixSwitch.Root>
  );
});
