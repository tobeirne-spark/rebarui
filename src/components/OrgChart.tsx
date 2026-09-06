import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { NodeLinkGraph } from "./NodeLinkGraph";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "./NodeLinkGraph";

export interface OrgChartPerson {
  id: string;
  name: string;
  /** This person's job title (e.g. "Engineering Manager"). Named `role`, not `title` — the chart
   * itself already has its own `title` prop (the chart's visible caption, per
   * ref/HEURISTICS.md #16), and having a person-level `title` field would mean the word "title"
   * refers to two entirely different things depending on which object you're reading (one printed
   * once as a `<figcaption>`, the other printed per-node inside every box) — a real, easy-to-trip
   * ambiguity worth naming out of existence rather than documenting around. */
  role: string;
  /** This person's manager. Omit (or point at an id not present in `people`) to make this person a
   * root — an org chart can have more than one root (e.g. co-CEOs), same as `NodeLinkGraph` itself
   * allows more than one node with no resolvable `parentId`. */
  parentId?: string;
}

export interface OrgChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  people: OrgChartPerson[];
  /** Rendered as a real, visible caption above the chart — see ref/HEURISTICS.md #16. Distinct
   * from each person's own `role` (see `OrgChartPerson.role` doc comment for why that field isn't
   * called `title`). */
  title?: string;
  /** Falls back to `title` when omitted — the chart's own accessible name. */
  ariaLabel?: string;
  /** Viewport width in SVG units. Forwarded to the underlying `NodeLinkGraph`. Default `480`. */
  width?: number;
  /** Viewport height in SVG units. Forwarded to the underlying `NodeLinkGraph`. Default `360`. */
  height?: number;
  className?: string;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;
const LABEL_SEPARATOR = "\n";

/**
 * A tree-shaped org hierarchy — a thin, opinionated `NodeLinkGraph` specialization, not a
 * reimplementation of its layout/pan/zoom/drag logic. An org chart is always a top-down tree, so
 * `layout` isn't exposed as a prop here (it's hardcoded to `"hierarchical"`) the way it is on the
 * general-purpose `NodeLinkGraph` — there's no reasonable case for a circular or manual org chart.
 *
 * One edge is generated automatically per non-root person (`parentId` → that person); callers never
 * supply `edges` directly. Each node renders as a two-line label (name bold, role smaller) via a
 * `renderNode` that splits on the same "\n" this component itself joins the two fields with —
 * see `OrgChartPerson.role`'s doc comment for why that field isn't named `title`.
 */
export function OrgChart({
  people,
  title,
  ariaLabel,
  width = 480,
  height = 360,
  className,
  ...props
}: OrgChartProps) {
  const nodes = useMemo<NodeLinkGraphNode[]>(
    () =>
      people.map((person) => ({
        id: person.id,
        label: `${person.name}${LABEL_SEPARATOR}${person.role}`,
        parentId: person.parentId,
      })),
    [people],
  );

  const edges = useMemo<NodeLinkGraphEdge[]>(
    () =>
      people
        .filter((person): person is OrgChartPerson & { parentId: string } => Boolean(person.parentId))
        .map((person) => ({ source: person.parentId, target: person.id })),
    [people],
  );

  return (
    <NodeLinkGraph
      className={clsx("rebar-org-chart", className)}
      data-rebar-component="org-chart"
      nodes={nodes}
      edges={edges}
      layout="hierarchical"
      title={title}
      ariaLabel={ariaLabel}
      width={width}
      height={height}
      renderNode={(node) => {
        const [name, role] = node.label.split(LABEL_SEPARATOR);
        return (
          <>
            <rect
              x={-NODE_WIDTH / 2}
              y={-NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={6}
              fill={node.color ?? "var(--rebar-color-bg-primary, #ffffff)"}
              stroke="var(--rebar-color-border-strong, #333333)"
              strokeWidth={1.5}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              y={-6}
              fontSize="var(--rebar-font-size-sm, 12px)"
              fontWeight="bold"
              fill="var(--rebar-color-text-primary, #212121)"
            >
              {name}
            </text>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              y={10}
              fontSize="var(--rebar-font-size-xs, 10px)"
              fill="var(--rebar-color-text-secondary, #757575)"
            >
              {role ?? ""}
            </text>
          </>
        );
      }}
      {...props}
    />
  );
}
