import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface IframeProps extends ComponentPropsWithoutRef<"iframe"> {
  src: string;
  /** Required, not optional like the native attribute — an `<iframe>` with no accessible name is
   * a real, common accessibility gap (a screen reader has nothing to announce for embedded
   * content otherwise). */
  title: string;
}

/**
 * A real `<iframe>` — embedding another page/app (a live demo, a migrated build) inside this one.
 * Deliberately thin: no default border/height, since those depend entirely on where it's used
 * (see the `comparison` block, which wraps this in its own bordered panel and measures a height
 * for it) — this component's only job is the element itself, plus the accessibility fix above.
 */
export const Iframe = forwardRef<HTMLIFrameElement, IframeProps>(function Iframe(
  { src, title, className, ...props },
  ref,
) {
  return (
    <iframe
      ref={ref}
      src={src}
      title={title}
      className={clsx("rebar-iframe", className)}
      data-rebar-component="iframe"
      {...props}
    />
  );
});
