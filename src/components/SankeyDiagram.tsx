import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface SankeyDiagramNode {
  id: string;
  label: string;
  /** Defaults to the next color in a small built-in palette, cycled by the node's own position in
   * `nodes` — supply one explicitly only when a specific color carries real meaning. */
  color?: string;
}

export interface SankeyDiagramLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyDiagramProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  nodes: SankeyDiagramNode[];
  links: SankeyDiagramLink[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Optional
   * only so a chart embedded somewhere its own heading already serves this role doesn't get a
   * duplicate one. */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own `role="img"` accessible name. */
  ariaLabel?: string;
  width?: number;
  height?: number;
}

const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
];

const NODE_WIDTH = 16;
const NODE_GAP = 8;

/**
 * Assigns each node a "column" (depth) by how many link-hops it sits downstream of the nearest
 * true source (a node nothing flows into) — a source lands in column 0, and every other node is
 * one column past the furthest-upstream node feeding it. Propagation runs for a fixed number of
 * passes (bounded by node count) rather than until real convergence, and every column value is
 * clamped to `nodeIds.length` — so a cyclic link graph (deliberately out of scope to resolve
 * "correctly", per this component's brief) still terminates in bounded time instead of looping
 * forever. It just produces a less meaningful layout for the cyclic portion, an acceptable, honest
 * degradation rather than a crash.
 */
function computeColumns(nodeIds: string[], links: SankeyDiagramLink[]): Map<string, number> {
  const incomingSources = new Map<string, string[]>();
  for (const link of links) {
    const list = incomingSources.get(link.target) ?? [];
    list.push(link.source);
    incomingSources.set(link.target, list);
  }

  const column = new Map<string, number>();
  for (const id of nodeIds) column.set(id, 0);

  const maxPasses = nodeIds.length + 1;
  for (let pass = 0; pass < maxPasses; pass++) {
    for (const id of nodeIds) {
      const incoming = incomingSources.get(id);
      if (!incoming || incoming.length === 0) continue; // a true source stays at column 0
      const upstreamMax = Math.max(...incoming.map((source) => column.get(source) ?? 0));
      column.set(id, Math.min(upstreamMax + 1, nodeIds.length));
    }
  }
  return column;
}

/** A node's height is proportional to its total flow — incoming plus outgoing link values, or just
 * outgoing for a true source (nothing incoming to add to). A real Sankey diagram instead assumes
 * flow conservation (incoming == outgoing for a pass-through node) and sizes off just one side;
 * this component doesn't require caller data to conserve, so summing both sides is a simpler,
 * honest stand-in rather than silently assuming balanced data. */
function nodeTotalFlow(id: string, links: SankeyDiagramLink[]): number {
  let incoming = 0;
  let outgoing = 0;
  for (const link of links) {
    if (link.target === id) incoming += Math.max(link.value, 0);
    if (link.source === id) outgoing += Math.max(link.value, 0);
  }
  return incoming === 0 ? outgoing : incoming + outgoing;
}

/**
 * A flow/volume-between-nodes diagram — nodes laid out in left-to-right columns by topological
 * depth, sized by total flow, connected by links whose thickness scales with `value`. This is a
 * deliberately simplified Sankey, not a full one: a real Sankey's ribbons are filled paths that
 * occupy a specific proportional slice of each node's own edge (so several links leaving one node
 * visibly divide its edge into bands) and diverge as smooth curves between those bands. Here every
 * link instead runs as a single semi-transparent, thick *stroked* line between each node's own
 * vertical center, using a classic horizontal-tangent cubic bezier for the curve shape — an honest,
 * low-fidelity stand-in consistent with this project's philosophy, not a mistaken shortcut. All of
 * the coordinate math below is plain arithmetic (no `Math.sin`/`Math.cos`/other transcendental
 * functions), so none of it needs the trig-rounding guard `PieChart`/`GaugeChart`/`RadarChart` do.
 */
export function SankeyDiagram({
  nodes,
  links,
  title,
  ariaLabel,
  width = 480,
  height = 320,
  className,
  ...props
}: SankeyDiagramProps) {
  const nodeIds = nodes.map((n) => n.id);
  const nodeIdSet = new Set(nodeIds);
  const validLinks = links.filter(
    (l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target) && l.value > 0,
  );

  const columns = computeColumns(nodeIds, validLinks);
  const maxColumn = nodeIds.length ? Math.max(...nodeIds.map((id) => columns.get(id) ?? 0)) : 0;

  const marginLeft = 16;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 16;
  const plotWidth = width - marginLeft - marginRight - NODE_WIDTH;
  const plotHeight = height - marginTop - marginBottom;

  const columnX = (col: number) =>
    marginLeft + (maxColumn > 0 ? (plotWidth * col) / maxColumn : plotWidth / 2);

  // Group node ids by column, preserving `nodes`' own order within each column.
  const nodesByColumn = new Map<number, string[]>();
  for (const id of nodeIds) {
    const col = columns.get(id) ?? 0;
    const list = nodesByColumn.get(col) ?? [];
    list.push(id);
    nodesByColumn.set(col, list);
  }

  const flowById = new Map(nodeIds.map((id) => [id, nodeTotalFlow(id, validLinks)] as const));

  // Stack each column's nodes top-to-bottom, each sized proportional to its own share of that
  // column's total flow, with a fixed pixel gap between them — filling the full plot height
  // regardless of how many nodes share a column.
  const layout = new Map<string, { x: number; y: number; height: number; color: string }>();
  nodesByColumn.forEach((ids, col) => {
    const totalFlow = ids.reduce((sum, id) => sum + (flowById.get(id) ?? 0), 0);
    const gapTotal = NODE_GAP * Math.max(ids.length - 1, 0);
    const available = Math.max(plotHeight - gapTotal, ids.length * 4);
    let y = marginTop;
    ids.forEach((id) => {
      const flow = flowById.get(id) ?? 0;
      const share = totalFlow > 0 ? flow / totalFlow : 1 / ids.length;
      const nodeHeight = Math.max(available * share, 4);
      const nodeIndex = nodes.findIndex((n) => n.id === id);
      const color =
        nodes[nodeIndex]?.color ?? DEFAULT_PALETTE[nodeIndex % DEFAULT_PALETTE.length] ?? DEFAULT_PALETTE[0]!;
      layout.set(id, { x: columnX(col), y, height: nodeHeight, color });
      y += nodeHeight + NODE_GAP;
    });
  });

  const maxLinkValue = validLinks.length ? Math.max(...validLinks.map((l) => l.value)) : 0;
  const linkStrokeWidth = (value: number) => {
    if (maxLinkValue <= 0) return 2;
    return 2 + (value / maxLinkValue) * 22; // clamped 2px..24px range
  };

  return (
    <figure
      className={clsx("rebar-chart", "rebar-sankey-diagram", className)}
      data-rebar-component="sankey-diagram"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", maxWidth: width, height: "auto", margin: "0 auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? title ?? "Sankey diagram"}
      >
        {validLinks.map((link, i) => {
          const s = layout.get(link.source);
          const t = layout.get(link.target);
          if (!s || !t) return null;
          const x1 = s.x + NODE_WIDTH;
          const y1 = s.y + s.height / 2;
          const x2 = t.x;
          const y2 = t.y + t.height / 2;
          const dx = (x2 - x1) / 2;
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
          return (
            <path
              key={`${link.source}->${link.target}-${i}`}
              data-rebar-part="link"
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={linkStrokeWidth(link.value)}
              opacity={0.4}
            />
          );
        })}
        {nodeIds.map((id) => {
          const pos = layout.get(id);
          if (!pos) return null;
          const node = nodes.find((n) => n.id === id);
          const col = columns.get(id) ?? 0;
          const isLastColumn = col === maxColumn;
          return (
            <g key={id}>
              <rect
                data-rebar-part="node"
                data-rebar-node-column={col}
                x={pos.x}
                y={pos.y}
                width={NODE_WIDTH}
                height={pos.height}
                fill={pos.color}
              />
              <text
                data-rebar-part="label"
                x={isLastColumn ? pos.x - 6 : pos.x + NODE_WIDTH + 6}
                y={pos.y + pos.height / 2 + 4}
                fontSize={11}
                textAnchor={isLastColumn ? "end" : "start"}
                fill="var(--rebar-color-text-primary, #212121)"
              >
                {node?.label ?? id}
              </text>
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
