import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface WordCloudWord {
  text: string;
  weight: number;
  /** Defaults to the next color in a small built-in palette, cycled by the word's position after
   * sorting by weight descending — supply one explicitly only when a specific color carries real
   * meaning. */
  color?: string;
}

export interface WordCloudProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  words: WordCloudWord[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  width?: number;
  height?: number;
  /** Force bionic reading on/off for the title, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
];

const MIN_FONT_PX = 12;
const MAX_FONT_PX = 48;

// Same deterministic string hash `Sticky`/`stickyColor.ts` uses for its own rotation — the same
// word text always produces the same small tilt, rather than reshuffling on every render. Not
// `Math.random()`: this is a pure function of the string's own char codes.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function fontSizeFor(weight: number, minWeight: number, maxWeight: number): number {
  if (maxWeight <= minWeight) return (MIN_FONT_PX + MAX_FONT_PX) / 2;
  // sqrt, not linear: the word-cloud convention treats `weight` as proportional to a word's
  // rendered *area*, not its raw font-size/height, so the visual size gap between a middling and a
  // top word reads less extreme than a straight linear map would make it. `Math.sqrt` is IEEE-754
  // correctly-rounded (unlike sin/cos/etc.), so — per this project's own hydration-safety fix on
  // PieChart/GaugeChart/RadarChart's trig math — it needs no extra rounding to stay identical
  // between a server render and client hydration; `ratio` is always within [0, 1] here since
  // `minWeight`/`maxWeight` are this same word list's own min/max, so the result is always within
  // [MIN_FONT_PX, MAX_FONT_PX] by construction.
  const ratio = Math.sqrt((weight - minWeight) / (maxWeight - minWeight));
  return MIN_FONT_PX + ratio * (MAX_FONT_PX - MIN_FONT_PX);
}

// No DOM/canvas `measureText` is available during a server render, so each word's width is
// approximated as a fixed fraction of its character count times its own font size — a common,
// deliberately rough stand-in for real text measurement, good enough for this component's loose
// row-flow placement. See the component doc comment for why real collision-avoiding cloud packing
// is out of scope entirely.
function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

/**
 * A size-weighted text visualization — bigger `weight`, bigger word. This intentionally does NOT
 * attempt real spiral/collision-avoiding cloud packing (a genuinely hard, iterative algorithm out
 * of scope for this project's low-fidelity philosophy): words are sorted by weight descending and
 * flowed left-to-right, wrapping to a new row once the current one would overflow `width` — a
 * simple, honest row layout, not a packed cloud shape. Each word's own small rotation is derived
 * deterministically from a hash of its own text (the same technique `Sticky.tsx` uses for its own
 * postit tilt), so the same input always renders pixel-identical rather than reshuffling on every
 * render — nothing here uses `Math.random()`.
 */
export function WordCloud({
  words,
  title,
  ariaLabel,
  width = 480,
  height = 320,
  bionic,
  bionicOptions,
  className,
  ...props
}: WordCloudProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const marginLeft = 16;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 16;
  const rowGap = 6;
  const wordGap = 10;

  const weights = words.map((w) => w.weight);
  const minWeight = weights.length ? Math.min(...weights) : 0;
  const maxWeight = weights.length ? Math.max(...weights) : 0;

  const sorted = [...words].sort((a, b) => b.weight - a.weight);

  let x = marginLeft;
  let y = marginTop;
  let rowMaxFontSize = 0;
  let started = false;

  const placed = sorted.map((word, i) => {
    const fontSize = fontSizeFor(word.weight, minWeight, maxWeight);
    const textWidth = approxTextWidth(word.text, fontSize);
    if (started && x + textWidth > width - marginRight) {
      x = marginLeft;
      y += rowMaxFontSize + rowGap;
      rowMaxFontSize = 0;
    }
    if (!started) y += fontSize; // first row's baseline sits one font-size below the top margin
    rowMaxFontSize = Math.max(rowMaxFontSize, fontSize);
    const color = word.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? DEFAULT_PALETTE[0]!;
    // Small deterministic -6..6deg tilt, keyed off the word's own text.
    const rotation = (hashString(word.text) % 13) - 6;
    const placedWord = { word, x, y, fontSize, color, rotation };
    x += textWidth + wordGap;
    started = true;
    return placedWord;
  });

  const lastPlaced = placed[placed.length - 1];
  const contentHeight = lastPlaced ? lastPlaced.y + rowMaxFontSize + marginBottom : height;
  const viewHeight = Math.max(height, contentHeight);

  return (
    <figure
      className={clsx("rebar-chart", "rebar-word-cloud", className)}
      data-rebar-component="word-cloud"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${viewHeight}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Word cloud"}
      >
        {placed.map(({ word, x: wx, y: wy, fontSize, color, rotation }) => (
          <text
            key={word.text}
            data-rebar-part="word"
            x={wx}
            y={wy}
            fontSize={fontSize}
            fill={color}
            transform={`rotate(${rotation} ${wx} ${wy})`}
          >
            {word.text}
          </text>
        ))}
      </svg>
      {title ? (
        <figcaption
          data-rebar-part="title"
          style={{
            textAlign: "center",
            fontSize: "var(--rebar-font-size-sm)",
            color: "var(--rebar-color-text-secondary, #757575)",
            marginTop: "var(--rebar-space-xs)",
          }}
        >
          {titleContent}
        </figcaption>
      ) : null}
    </figure>
  );
}
