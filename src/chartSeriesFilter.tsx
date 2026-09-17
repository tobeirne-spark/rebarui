import { useState } from "react";
import clsx from "clsx";

/**
 * Shared hide/show-a-series-by-label state, promoted out of `@rebar-ui/placement`'s
 * `BlockRenderer.tsx` (which had this exact hook, plus the footer below, duplicated three times —
 * once per chart block type) so a real `packages/core` chart component can offer the same
 * capability directly to a caller who isn't going through the placement layer at all. A label
 * starts visible; toggling it once hides it, toggling again shows it back.
 */
export function useSeriesFilter(_labels: string[]) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (label: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };
  return { hidden, toggle, isVisible: (label: string) => !hidden.has(label) };
}

export interface ChartFilterFooterProps {
  labels: string[];
  hidden: Set<string>;
  onToggle: (label: string) => void;
}

/**
 * A row of toggle buttons, one per series/segment label — reuses the exact
 * `.rebar-chart-filter-button`/`-inactive` classes `@rebar-ui/placement`'s own chart blocks
 * already style through this same stylesheet (see that rule's own comment: this file is the
 * single CSS source for every `rebar-*` class regardless of which package's markup uses it).
 * Renders nothing at all for a single-series chart — there's nothing meaningful to filter.
 */
export function ChartFilterFooter({ labels, hidden, onToggle }: ChartFilterFooterProps) {
  if (labels.length <= 1) return null;
  return (
    <div
      className="rebar-chart-filters"
      data-rebar-part="chart-filters"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--rebar-space-xs, 4px)",
        justifyContent: "center",
        marginTop: "var(--rebar-space-xs, 4px)",
      }}
    >
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          className={clsx("rebar-chart-filter-button", hidden.has(label) && "rebar-chart-filter-button-inactive")}
          aria-pressed={!hidden.has(label)}
          onClick={() => onToggle(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
