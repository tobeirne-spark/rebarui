import { forwardRef } from "react";
import * as RadixProgress from "@radix-ui/react-progress";
import clsx from "clsx";

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  "aria-label"?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max = 100, className, ...props },
  ref,
) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <RadixProgress.Root
      ref={ref}
      className={clsx("rebar-progress", className)}
      data-rebar-component="progress"
      value={value}
      max={max}
      {...props}
    >
      <RadixProgress.Indicator
        className="rebar-progress-indicator"
        data-rebar-part="indicator"
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </RadixProgress.Root>
  );
});
