import { useCallback, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export interface ChartMarkSelection<K extends string = string> {
  /** The mark to show a value tag for right now — the persistently selected mark if one is set,
   * otherwise whichever mark is currently hovered, otherwise `null` (show nothing). */
  activeKey: K | null;
  /** True only once `key` has been clicked into the persistent selection — distinct from merely
   * being hovered, for a chart that wants to style a selected mark differently (e.g. a slightly
   * larger point/thicker stroke) in addition to showing its tag. */
  isSelected: (key: K) => boolean;
  /** Spread onto each individual mark's own SVG element (a `<circle>`, `<rect>`, ...). */
  getMarkProps: (key: K) => {
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    onClick: (event: ReactMouseEvent) => void;
  };
  /** Spread onto the chart's own background — the plot-area `<rect>`, or the `<svg>` root itself —
   * so a "dead click" (one that doesn't land on any mark) clears the persistent selection back to
   * hover-only. Marks themselves stop propagation in their own `onClick`, so a click that does land
   * on a mark never also fires this. */
  backgroundProps: {
    onClick: () => void;
  };
}

/**
 * Shared hover/selection state for a chart's individually-selectable data marks — see
 * ref/HEURISTICS.md #16's elaborated "interactive value disclosure" facet: hovering a mark shows
 * its value in a tag; clicking makes that tag persist past the hover ending (clicking a different
 * mark swaps which one persists, clicking the same one again or a dead click on empty chart space
 * clears it). One hook, reused across every chart with this pattern (`AreaChart`, `BubbleChart`,
 * `BoxPlot`, `Heatmap`, `LineChart`) rather than five independent implementations that would
 * inevitably drift from each other in exactly how "hover vs. selected" is resolved.
 */
export function useChartMarkSelection<K extends string = string>(): ChartMarkSelection<K> {
  const [hoveredKey, setHoveredKey] = useState<K | null>(null);
  const [selectedKey, setSelectedKey] = useState<K | null>(null);

  const activeKey = selectedKey ?? hoveredKey;

  const isSelected = useCallback((key: K) => selectedKey === key, [selectedKey]);

  const getMarkProps = useCallback(
    (key: K) => ({
      onPointerEnter: () => setHoveredKey(key),
      onPointerLeave: () => setHoveredKey((current) => (current === key ? null : current)),
      onClick: (event: ReactMouseEvent) => {
        // Stops the background's own onClick (below) from also firing and immediately clearing
        // right back out whatever this click just selected.
        event.stopPropagation();
        setSelectedKey((current) => (current === key ? null : key));
      },
    }),
    [],
  );

  const backgroundProps = {
    onClick: () => setSelectedKey(null),
  };

  return { activeKey, isSelected, getMarkProps, backgroundProps };
}

export interface ChartValueTagProps {
  /** Anchor point in the SVG's own coordinate space — the tag is drawn just above this point by
   * default, flipping below when there isn't room above. */
  x: number;
  y: number;
  /** The chart's plot bounds, so the tag can clamp itself within the visible canvas rather than
   * ever drawing partly outside it. */
  viewBoxWidth: number;
  viewBoxHeight: number;
  /** One line of text per row — e.g. a series label plus its value, or a box plot's five-number
   * summary, one line each. */
  lines: string[];
  /** Accent color for the tag's border/first line (typically the mark's own series color) —
   * defaults to the ambient text/border colors when omitted. */
  accentColor?: string;
}

const TAG_LINE_HEIGHT = 14;
const TAG_PADDING_X = 8;
const TAG_PADDING_Y = 6;
const TAG_OFFSET = 10;
const TAG_FONT_SIZE = 11;
// A rough average character width for this font-size — good enough for sizing a small background
// rect without needing a real text-measurement pass (this is a low-fidelity chart tag, not
// typeset copy); errs slightly wide rather than clipping.
const APPROX_CHAR_WIDTH = 6.4;

/**
 * The floating value tag itself — shared visual shell for `useChartMarkSelection`'s `activeKey`,
 * so every chart's tag looks and clamps the same way rather than five separate implementations.
 * Pure presentation: content is entirely caller-supplied via `lines`. `pointerEvents="none"` so the
 * tag itself never intercepts the hover/click it's currently displaying the result of.
 */
export function ChartValueTag({ x, y, viewBoxWidth, viewBoxHeight, lines, accentColor }: ChartValueTagProps) {
  if (lines.length === 0) return null;
  const longestLine = Math.max(...lines.map((line) => line.length));
  const boxWidth = longestLine * APPROX_CHAR_WIDTH + TAG_PADDING_X * 2;
  const boxHeight = lines.length * TAG_LINE_HEIGHT + TAG_PADDING_Y * 2;

  let boxX = x - boxWidth / 2;
  boxX = Math.max(2, Math.min(boxX, viewBoxWidth - boxWidth - 2));

  let boxY = y - boxHeight - TAG_OFFSET;
  if (boxY < 2) boxY = Math.min(y + TAG_OFFSET, viewBoxHeight - boxHeight - 2);

  return (
    <g data-rebar-part="value-tag" pointerEvents="none">
      <rect
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        rx={4}
        fill="var(--rebar-color-bg-primary, #ffffff)"
        stroke={accentColor ?? "var(--rebar-color-border-strong, #333333)"}
        strokeWidth={1.5}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={boxX + TAG_PADDING_X}
          y={boxY + TAG_PADDING_Y + (i + 1) * TAG_LINE_HEIGHT - 4}
          fontSize={TAG_FONT_SIZE}
          fill={i === 0 ? (accentColor ?? "var(--rebar-color-text-primary, #212121)") : "var(--rebar-color-text-primary, #212121)"}
          fontWeight={i === 0 ? 600 : 400}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
