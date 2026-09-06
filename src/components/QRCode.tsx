import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { create } from "qrcode";
import clsx from "clsx";

/**
 * One module's override, indexed `[row][col]` in a grid the same size as the code's own module
 * grid (see `moduleCount` — render once with no `pictogram` and inspect `data-rebar-module-count`
 * on the root, or just pass a grid smaller than the real one; out-of-range cells are ignored):
 * `true` forces that module dark using the default `color`; a string forces it dark using that
 * exact color; `false` forces it light even if the real encoded data is dark there; `undefined`/
 * `null` (or simply omitting that row/cell) leaves the real encoded value alone. Only ever
 * *recolors or force-toggles individual modules* — never changes the encoded payload itself, so
 * this is how a caller draws a pictograph using the code's own black squares (a logo silhouette,
 * a bit of color) without touching what the code actually decodes to.
 */
export type QRCodePictogramModule = boolean | string | null | undefined;

export interface QRCodeProps extends Omit<ComponentPropsWithoutRef<"svg">, "color"> {
  /** The text/URL to encode. */
  value: string;
  /** Rendered size in pixels — the code is always square. */
  size?: number;
  /** Module (foreground) color. */
  color?: string;
  /** Background color — set to `"transparent"` to omit the background rect entirely. */
  bgColor?: string;
  /** Reed-Solomon error correction level — higher tolerates more damage/occlusion (relevant
   * when overlaying `icon` or `pictogram`) at the cost of a denser code. Defaults to "M", the
   * standard default for most real-world uses; "H" is worth it specifically when using `icon`
   * or forcing modules light/dark via `pictogram`. */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  /** An optional logo/icon overlaid in the center — either an image URL/data URI (rendered as a
   * real `<image>`) or raw inline SVG content (a fragment of `<path>`/`<circle>`/etc. elements,
   * not a wrapping `<svg>` tag) authored against a 24×24 viewBox, the same convention Material
   * Design/most icon sets use — it's re-scaled into a nested `<svg viewBox="0 0 24 24">` sized to
   * `iconSizeRatio * size`, so no data-URI encoding is needed for a plain vector logo. Keep it
   * small (the default `iconSizeRatio` caps it at 20% of the code's width) and use
   * `errorCorrectionLevel="H"` alongside it, or the overlay can occlude enough of the code to
   * make it unscannable. */
  icon?: string | ReactNode;
  /** Fraction of the code's width the icon occupies — default 0.2 (20%), matching AntD's QRCode. */
  iconSizeRatio?: number;
  /** A grid of per-module overrides — see `QRCodePictogramModule` above. Recoloring already-dark
   * modules is always safe (never changes what the code decodes to); forcing a module light/dark
   * that the real data disagrees with spends into the same error-correction budget `icon` does,
   * so pair heavier use with `errorCorrectionLevel="H"` and verify the result still scans. */
  pictogram?: QRCodePictogramModule[][];
}

/**
 * A real, scannable QR code — encoded via the `qrcode` package's synchronous, dependency-free
 * `create()` API (Reed-Solomon error correction and module placement are genuinely intricate to
 * get right; a hand-rolled encoder risks producing a code that *looks* right but doesn't scan,
 * which is worse than not having one — this is the same "small, correctness-critical dependency"
 * tradeoff `AspectRatio`'s Radix primitive already made). Rendered as real SVG rects, not a raster
 * image or canvas, so it stays crisp at any size and themes like any other rebar-ui component.
 */
export function QRCode({
  value,
  size = 160,
  color = "#000000",
  bgColor = "#ffffff",
  errorCorrectionLevel = "M",
  icon,
  iconSizeRatio = 0.2,
  pictogram,
  className,
  ...props
}: QRCodeProps) {
  const qr = create(value, { errorCorrectionLevel });
  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const cell = size / moduleCount;

  const iconSize = icon ? size * iconSizeRatio : 0;
  const iconOffset = (size - iconSize) / 2;
  const iconIsUrl = typeof icon === "string";

  return (
    <svg
      className={clsx("rebar-qrcode", className)}
      data-rebar-component="qrcode"
      data-rebar-module-count={moduleCount}
      role="img"
      aria-label={`QR code for ${value}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...props}
    >
      {bgColor !== "transparent" ? <rect width={size} height={size} fill={bgColor} /> : null}
      {Array.from(data).map((bit, i) => {
        const row = Math.floor(i / moduleCount);
        const col = i % moduleCount;
        const override = pictogram?.[row]?.[col];
        const isDark = override === false ? false : override !== undefined && override !== null ? true : !!(bit & 1);
        if (!isDark) return null;
        const x = col * cell;
        const y = row * cell;
        if (
          icon &&
          x + cell > iconOffset &&
          x < iconOffset + iconSize &&
          y + cell > iconOffset &&
          y < iconOffset + iconSize
        ) {
          return null;
        }
        const fill = typeof override === "string" ? override : color;
        return <rect key={i} x={x} y={y} width={cell} height={cell} fill={fill} data-rebar-part="module" />;
      })}
      {icon ? (
        iconIsUrl ? (
          <image href={icon} x={iconOffset} y={iconOffset} width={iconSize} height={iconSize} />
        ) : (
          <g transform={`translate(${iconOffset}, ${iconOffset})`} data-rebar-part="icon">
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
              {icon}
            </svg>
          </g>
        )
      ) : null}
    </svg>
  );
}
