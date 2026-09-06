import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderChartEmptyState } from "../chartEmptyState";

export interface WaterfallChartStep {
  label: string;
  /** A positive or negative delta for a normal step. Ignored as a delta (but still shown as the
   * bar's own height) when `isTotal` is set. */
  value: number;
  /** Renders this bar from zero rather than floating from the running cumulative — for a starting
   * or ending total bar. */
  isTotal?: boolean;
}

export interface WaterfallChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  steps: WaterfallChartStep[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  height?: number;
  yFormat?: (v: number) => string;
}

/**
 * A cumulative incremental-change chart — a starting total, a sequence of +/- deltas, an ending
 * total — where each bar floats at its own cumulative height rather than starting from zero (a
 * total bar excepted, which always renders from zero). Adapted from `StackedBarChart`'s bar-scaling
 * math: same tick/gridline layout, but an absolute (not stacked-from-zero) `yScale`, since a
 * floating bar's top and bottom can each independently land anywhere in the value range, including
 * below zero.
 */
export function WaterfallChart({
  steps,
  title,
  ariaLabel,
  height = 340,
  yFormat = (v: number) => Math.round(v).toLocaleString(),
  className,
  ...props
}: WaterfallChartProps) {
  const width = 700;
  const marginLeft = 74;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 40;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // Running cumulative level before (levels[i]) and after (levels[i + 1]) each step. A normal step
  // floats between these two levels; a total step resets the running level to its own absolute
  // value (its bar is rendered from 0 separately, below).
  if (steps.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-waterfall-chart", className)}
        data-rebar-component="waterfall-chart"
        style={{ margin: 0 }}
        {...props}
      >
        {renderChartEmptyState(height)}
      </figure>
    );
  }
  let running = 0;
  const levels = [running];
  for (const step of steps) {
    running = step.isTotal ? step.value : running + step.value;
    levels.push(running);
  }

  const rawMin = Math.min(0, ...levels);
  const rawMax = Math.max(0, ...levels);
  const pad = (rawMax - rawMin) * 0.1 || Math.abs(rawMax) * 0.1 || 1;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yScale = (v: number) => marginTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
  const zeroY = yScale(0);

  const n = steps.length;
  const bandWidth = n > 0 ? plotWidth / n : plotWidth;
  const barWidth = bandWidth * 0.5;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  return (
    <figure
      className={clsx("rebar-chart", "rebar-waterfall-chart", className)}
      data-rebar-component="waterfall-chart"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Waterfall chart"}
      >
        {ticks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={i}>
              <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="var(--rebar-color-border, #e0e0e0)" strokeWidth={1} />
              <text x={marginLeft - 8} y={y + 4} fontSize={11} textAnchor="end" fill="var(--rebar-color-text-secondary, #757575)">
                {yFormat(t)}
              </text>
            </g>
          );
        })}
        <line x1={marginLeft} y1={zeroY} x2={width - marginRight} y2={zeroY} stroke="var(--rebar-color-text-secondary, #757575)" strokeWidth={1} />
        {steps.map((step, i) => {
          const prevLevel = levels[i] ?? 0;
          const afterLevel = levels[i + 1] ?? 0;
          const from = step.isTotal ? 0 : prevLevel;
          const to = afterLevel;
          const top = Math.max(from, to);
          const bottom = Math.min(from, to);
          const barHeight = Math.max(yScale(bottom) - yScale(top), 1.5);
          const yTop = yScale(top);
          const cx = marginLeft + bandWidth * (i + 0.5);
          const color = step.isTotal
            ? "var(--rebar-color-primary, #0066cc)"
            : step.value >= 0
              ? "var(--rebar-color-success, #2e7d32)"
              : "var(--rebar-color-danger, #d32f2f)";
          const nextStep = steps[i + 1];
          const nextLevel = levels[i + 1];
          const showConnector = i < n - 1 && !nextStep?.isTotal && nextLevel !== undefined;

          return (
            <g key={`${step.label}-${i}`} data-rebar-part="step">
              <rect x={cx - barWidth / 2} y={yTop} width={barWidth} height={barHeight} fill={color} />
              <text
                x={cx}
                y={yTop - 8}
                fontSize={12}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {step.isTotal ? yFormat(step.value) : `${step.value >= 0 ? "+" : ""}${yFormat(step.value)}`}
              </text>
              <text
                x={cx}
                y={marginTop + plotHeight + 22}
                fontSize={12}
                textAnchor="middle"
                fill="var(--rebar-color-text-primary, #212121)"
                style={{ fontWeight: 600 }}
              >
                {step.label}
              </text>
              {showConnector ? (
                <line
                  data-rebar-part="connector"
                  x1={cx + barWidth / 2}
                  y1={yScale(nextLevel as number)}
                  x2={cx + bandWidth}
                  y2={yScale(nextLevel as number)}
                  stroke="var(--rebar-color-border, #e0e0e0)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ) : null}
            </g>
          );
        })}
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
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}
