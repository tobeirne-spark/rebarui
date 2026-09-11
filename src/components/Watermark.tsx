import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

export interface WatermarkProps extends Omit<ComponentPropsWithoutRef<"div">, "color"> {
  children?: ReactNode;
  /** The repeated watermark text. Ignored if `image` is set. */
  text?: string;
  /** An image URL to repeat instead of text (a company logo, say). */
  image?: string;
  /** Width/height of the repeated image, in pixels — required when `image` is set, since an SVG
   * tile needs a real size to lay the image out at. */
  imageSize?: [number, number];
  /** [horizontal, vertical] gap between repeats, in pixels. */
  gap?: [number, number];
  /** Rotation of each repeat, in degrees. */
  rotate?: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  className?: string;
}

function buildTile({
  text,
  image,
  imageSize,
  gap,
  rotate,
  fontSize,
  color,
  opacity,
}: Required<Pick<WatermarkProps, "gap" | "rotate" | "fontSize" | "color" | "opacity">> &
  Pick<WatermarkProps, "text" | "image" | "imageSize">): string {
  const tileWidth = gap[0] + (image ? (imageSize?.[0] ?? 100) : (text?.length ?? 0) * fontSize * 0.6 + 40);
  const tileHeight = gap[1] + (image ? (imageSize?.[1] ?? 100) : fontSize + 40);
  const cx = tileWidth / 2;
  const cy = tileHeight / 2;

  const content = image
    ? `<image href="${image}" x="${cx - (imageSize?.[0] ?? 100) / 2}" y="${cy - (imageSize?.[1] ?? 100) / 2}" width="${imageSize?.[0] ?? 100}" height="${imageSize?.[1] ?? 100}" opacity="${opacity}" transform="rotate(${rotate} ${cx} ${cy})" />`
    : `<text x="${cx}" y="${cy}" font-size="${fontSize}" fill="${color}" opacity="${opacity}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotate} ${cx} ${cy})">${text ?? ""}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${tileHeight}">${content}</svg>`;
  return `data:image/svg+xml;base64,${toBase64Utf8(svg)}`;
}

// A real, hit-directly bug, not just a cosmetic hydration-mismatch warning: `window.btoa` encodes
// each JS string character as a single Latin1 byte, while `Buffer.from(str).toString("base64")`
// (the server-side branch this used to fall back to) encodes as real UTF-8 — for any non-ASCII
// watermark text (e.g. "©"), those two produce genuinely *different* base64 output, not just a
// differently-formatted one. Decoded as UTF-8 (an SVG's default), the client's Latin1-encoded byte
// is invalid UTF-8 on its own, which can render as a replacement character or corrupt the tile —
// worse than the console warning made it look. Fixed by UTF-8-encoding the string on both branches
// before base64, so server and client produce byte-identical output.
function toBase64Utf8(str: string): string {
  if (typeof window === "undefined") return Buffer.from(str, "utf-8").toString("base64");
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

/**
 * A repeating diagonal watermark overlaid on its children — real content protection/attribution
 * (a draft stamp, an internal-only marker, a licensed-image credit), not decoration. Built from a
 * plain inline SVG data URI tiled via CSS `background-repeat`, not canvas — stays crisp at any
 * size (SVG scales natively) and works during SSR with no `useEffect`/ref measurement pass, unlike
 * a canvas-rendered watermark. The overlay is `pointer-events: none` and `aria-hidden`, so it never
 * blocks interaction with the real content or gets announced as if it were part of it.
 */
export function Watermark({
  children,
  text = "REBAR UI",
  image,
  imageSize,
  gap = [100, 100],
  rotate = -22,
  fontSize = 16,
  color = "rgba(0, 0, 0, 0.15)",
  opacity = 1,
  className,
  style,
  ...props
}: WatermarkProps) {
  const tile = buildTile({ text, image, imageSize, gap, rotate, fontSize, color, opacity });

  return (
    <div
      className={clsx("rebar-watermark", className)}
      data-rebar-component="watermark"
      style={{ position: "relative", ...style }}
      {...props}
    >
      {children}
      <div
        className="rebar-watermark-overlay"
        data-rebar-part="overlay"
        aria-hidden="true"
        style={{
          position: "absolute",
          // A string "0px", not the bare number 0 or the `inset: 0` shorthand — a real, hit-
          // directly SSR hydration mismatch either other way: react-dom's server renderer always
          // serializes a numeric style value for one of these properties with a "px" suffix in the
          // literal HTML string, but a bare `0` (or the `inset` shorthand) computed client-side
          // during hydration doesn't reliably re-derive that exact "0px" string form for
          // comparison, so the two never match on first paint. An explicit "0px" string matches
          // the server's own serialization exactly, sidestepping the mismatch rather than leaving
          // a real console error on every page load.
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
          pointerEvents: "none",
          backgroundImage: `url("${tile}")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
