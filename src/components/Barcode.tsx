import type { ComponentPropsWithoutRef } from "react";
import Encoder from "code-128-encoder";
import clsx from "clsx";

export interface BarcodeProps extends Omit<ComponentPropsWithoutRef<"svg">, "color"> {
  /** The text to encode — printable ASCII (Code 128 supports the full range via automatic
   * code-set switching; the encoder used here handles that, not just a fixed subset). */
  value: string;
  /** Width of the narrowest bar, in px. The code's total width scales with content length at
   * this fixed unit, the same way a real barcode does — squishing an arbitrary total width to
   * fit would break the module-width ratios a scanner relies on. Default 2. */
  barWidth?: number;
  /** Bar height, in px. Default 60. */
  height?: number;
  /** Bar (foreground) color. */
  color?: string;
  /** Background color — set to `"transparent"` to omit the background rect entirely. */
  bgColor?: string;
  /** Shows the encoded value as human-readable text beneath the bars — the classic "digits
   * under the barcode" look. Default `true`. */
  showText?: boolean;
  /** Blank margin on each side, in units of `barWidth` — real barcodes need a "quiet zone" for
   * a scanner to reliably find the code's edges. Default 10, the common minimum. */
  quietZone?: number;
}

const encoder = new Encoder();

/**
 * A real, scannable Code 128 linear barcode — encoded via the `code-128-encoder` package (deps:
 * none, purpose-built as "an encoder, not a renderer": exactly the shape needed here, since this
 * component owns its own SVG rendering rather than delegating to a DOM-drawing library). Code 128
 * was chosen over the older subset symbologies (Code 39, etc.) because it packs the full
 * printable ASCII range through automatic code-set switching, rather than a fixed subset — hand-
 * rolling that switching logic (and the modulo-103 checksum) risks a code that *looks* right but
 * doesn't scan, the same "small, correctness-critical dependency" tradeoff `QRCode`'s own
 * `qrcode` dependency already made. Verified directly against a second, independent encoder
 * (`jsbarcode`) during development — both produced the identical bar pattern for the same input.
 *
 * Rendered as real SVG rects, not a raster image or a barcode font, so it stays crisp at any size
 * and themes like any other rebar-ui component.
 */
export function Barcode({
  value,
  barWidth = 2,
  height = 60,
  color = "#000000",
  bgColor = "#ffffff",
  showText = true,
  quietZone = 10,
  className,
  ...props
}: BarcodeProps) {
  // `code-128-encoder`'s TypeScript types declare `OutputMode` as an ambient `const enum`, which
  // `isolatedModules` (required by esbuild-based bundlers, including this package's own tsup
  // build) refuses to reference directly — the enum only carries its plain string values at
  // runtime regardless ("bars" is the real, documented value), so the cast below is a type-only
  // workaround for that interop quirk, not a guess at the actual runtime contract.
  const bars: string = value ? encoder.encode(value, { output: "bars" as Encoder.OutputMode.BARS }) : "";
  const quietZonePx = quietZone * barWidth;
  const codeWidth = bars.length * barWidth;
  const totalWidth = codeWidth + quietZonePx * 2;
  const textHeight = showText ? 20 : 0;
  const totalHeight = height + textHeight;

  return (
    <svg
      className={clsx("rebar-barcode", className)}
      data-rebar-component="barcode"
      role="img"
      aria-label={`Barcode for ${value}`}
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      {...props}
    >
      {bgColor !== "transparent" ? <rect width={totalWidth} height={totalHeight} fill={bgColor} /> : null}
      {Array.from(bars).map((bit, i) => {
        if (bit !== "1") return null;
        return (
          <rect
            key={i}
            data-rebar-part="bar"
            x={quietZonePx + i * barWidth}
            y={0}
            width={barWidth}
            height={height}
            fill={color}
          />
        );
      })}
      {showText ? (
        <text
          data-rebar-part="text"
          x={totalWidth / 2}
          y={height + 15}
          textAnchor="middle"
          fontSize={14}
          fontFamily="monospace"
          fill={color}
        >
          {value}
        </text>
      ) : null}
    </svg>
  );
}
