import type { ReactNode } from "react";
import clsx from "clsx";
import { Dialog } from "./Dialog";

export interface LightboxProps {
  src: string;
  alt: string;
  /** Defaults to rendering the image itself, at a normal thumbnail size, as the trigger —
   * clicking it opens the fullscreen preview. */
  trigger?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Click an image (or any trigger) to open a fullscreen preview overlay. Built directly on the
 * real Dialog component's `fullscreen` flag — no reimplemented modal/focus-trap logic here, and
 * Dialog's own close button is the only close button (no second one added).
 *
 * Pinch-zoom/pan is deliberately out of scope, for the same reason BottomSheet's drag handle
 * skipped real drag-to-dismiss physics: gesture physics (momentum, rubber-banding, multi-touch
 * scale/rotate) is a separate, harder problem than the "fullscreen preview + close" shape this
 * component covers.
 */
export function Lightbox({ src, alt, trigger, open, defaultOpen, onOpenChange, className }: LightboxProps) {
  const defaultTrigger = (
    <button
      type="button"
      className="rebar-lightbox-trigger"
      data-rebar-part="trigger"
      aria-label={`Open full image: ${alt}`}
    >
      <img src={src} alt={alt} className="rebar-lightbox-thumbnail" data-rebar-part="thumbnail" />
    </button>
  );

  return (
    <span className={clsx("rebar-lightbox", className)} data-rebar-component="lightbox">
      <Dialog
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        trigger={trigger ?? defaultTrigger}
        title={alt}
        fullscreen
        className="rebar-lightbox-dialog"
      >
        <img src={src} alt={alt} className="rebar-lightbox-image" data-rebar-part="image" />
      </Dialog>
    </span>
  );
}
