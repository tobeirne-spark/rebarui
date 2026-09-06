import { forwardRef } from "react";
import * as RadixAspectRatio from "@radix-ui/react-aspect-ratio";
import clsx from "clsx";
import { resolveRatioPlaceholder } from "./ratioPlaceholder";
import { Watermark } from "./Watermark";

export interface AspectRatioProps {
  /** width / height, e.g. 16 / 9. Defaults to 1 (square). */
  ratio?: number;
  src?: string;
  alt?: string;
  className?: string;
  /**
   * Shows one of Rebar's built-in placeholder photos when `src` isn't set yet — opt-in, off by
   * default. Picks whichever embedded placeholder's own ratio is numerically closest to `ratio`;
   * several placeholders share each ratio, so pass a number (e.g. a Carousel's slide index) to
   * pick a specific variant instead of always the same one — `true` defaults to the first.
   */
  placeholder?: boolean | number;
  /** Overlays a repeating diagonal watermark (a licensed-image credit, a draft/preview marker)
   * across the image via the real `Watermark` component. Off by default. */
  watermark?: string;
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 1, src, alt, className, placeholder, watermark },
  ref,
) {
  const imageSrc =
    src ?? (placeholder !== undefined && placeholder !== false
      ? resolveRatioPlaceholder(ratio, typeof placeholder === "number" ? placeholder : undefined)
      : undefined);

  const image = imageSrc ? (
    <img className="rebar-aspect-ratio-image" src={imageSrc} alt={alt ?? ""} />
  ) : (
    <div className="rebar-aspect-ratio-empty" data-rebar-part="empty" />
  );

  return (
    <RadixAspectRatio.Root
      ref={ref}
      ratio={ratio}
      className={clsx("rebar-aspect-ratio", className)}
      data-rebar-component="aspect-ratio"
    >
      {watermark ? (
        <Watermark text={watermark} style={{ width: "100%", height: "100%" }}>
          {image}
        </Watermark>
      ) : (
        image
      )}
    </RadixAspectRatio.Root>
  );
});
