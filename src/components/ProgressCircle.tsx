import type { ReactNode } from "react";
import clsx from "clsx";

export interface ProgressCircleProps {
  /** 0-100. Values outside that range are clamped. */
  percent: number;
  /** Diameter in px. Default `80`. */
  size?: number;
  /** Ring thickness in px. Default `8`. */
  strokeWidth?: number;
  /** Track (unfilled) ring color. */
  trackColor?: string;
  /** Filled-progress ring color. */
  color?: string;
  /** Centered label content — e.g. `"72%"` or an icon. */
  children?: ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * A plain circular progress ring — the antd-mobile `ProgressCircle` pattern: a lighter-weight
 * alternative to `GaugeChart` for a single "how far along is this" indicator (an upload, a
 * multi-step form's completion) with no axis labels, ticks, or thresholds to configure. Reach for
 * `GaugeChart` when those matter; reach for this when they'd just be visual noise around a bare
 * percentage.
 */
export function ProgressCircle({
  percent,
  size = 80,
  strokeWidth = 8,
  trackColor,
  color,
  children,
  ariaLabel,
  className,
}: ProgressCircleProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={clsx("rebar-progress-circle", className)}
      data-rebar-component="progress-circle"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `${Math.round(clamped)}%`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="rebar-progress-circle-track"
          data-rebar-part="track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={trackColor ? { stroke: trackColor } : undefined}
        />
        <circle
          className="rebar-progress-circle-fill"
          data-rebar-part="fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={color ? { stroke: color } : undefined}
        />
      </svg>
      {children ? (
        <div className="rebar-progress-circle-label" data-rebar-part="label">
          {children}
        </div>
      ) : null}
    </div>
  );
}
