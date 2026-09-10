import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { NodeLinkGraph } from "./NodeLinkGraph";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "./NodeLinkGraph";

export type FlowchartShape = "process" | "decision" | "start-end";

export interface FlowchartStep {
  id: string;
  label: string;
  /** Defaults to `"process"` when omitted. */
  shape?: FlowchartShape;
  /** Every id this step flows into. A step can list more than one (e.g. a decision's yes/no
   * branches) — this is why edges are derived from `next`, not from a single-parent `parentId`
   * field the way `OrgChart` derives its edges; a flowchart step can have multiple outgoing edges,
   * which a one-parent model can't express. */
  next?: string[];
}

export interface FlowchartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  steps: FlowchartStep[];
  /** Rendered as a real, visible caption above the diagram — see ref/HEURISTICS.md #16. */
  title?: string;
  /** Falls back to `title` when omitted — the diagram's own accessible name. */
  ariaLabel?: string;
  /** Viewport width in SVG units. Forwarded to the underlying `NodeLinkGraph`. Default `480`. */
  width?: number;
  /** Viewport height in SVG units. Forwarded to the underlying `NodeLinkGraph`. Default `360`. */
  height?: number;
  /** Inset kept clear between the diagram and its own edge — forwarded to the underlying
   * `NodeLinkGraph`. Default `24`; see ref/HEURISTICS.md's diagram-canvas-padding default. */
  padding?: number;
  className?: string;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;
const DECISION_HALF_WIDTH = 64;
const DECISION_HALF_HEIGHT = 32;

/**
 * Structured flowchart shapes (BPMN/UML-adjacent) on top of `NodeLinkGraph` — real edges derived
 * from each step's own `next` list, distinct shapes per step drawn via `renderNode`.
 *
 * **Layout is a documented best-effort, not a claim of a true DAG layout.** `NodeLinkGraph`'s
 * `"hierarchical"` layout needs a single `parentId` per node to assign a depth; a flowchart step
 * can have multiple incoming edges (a loop, two branches rejoining) or none, so there's no one real
 * "parent" to hand it. This component fabricates one purely for layout depth: each step's synthetic
 * parent is the *first* step (in `steps` array order, and within each step's own `next` array order)
 * whose `next` list names it — first-write-wins, everything after that first match is ignored for
 * layout purposes only (it still gets a real rendered edge). A step nothing points to becomes a
 * layout root. This produces a reasonable top-down picture for an ordinary linear-with-branches
 * flowchart; it is NOT a real topological sort and will not draw a clean tree for a flowchart with
 * genuine loops or multiple independent rejoining paths — those still render (every edge from
 * `next` is real and always drawn), just not necessarily in a visually optimal arrangement.
 */
export function Flowchart({
  steps,
  title,
  ariaLabel,
  width = 480,
  height = 360,
  padding,
  className,
  ...props
}: FlowchartProps) {
  const shapeById = useMemo(() => {
    const map = new Map<string, FlowchartShape>();
    for (const step of steps) map.set(step.id, step.shape ?? "process");
    return map;
  }, [steps]);

  const nodes = useMemo<NodeLinkGraphNode[]>(() => {
    // First step (in array + next-array order) that points at a given target id wins as its
    // synthetic layout parent — see the doc comment above for why this is best-effort only.
    const parentOf = new Map<string, string>();
    for (const step of steps) {
      for (const targetId of step.next ?? []) {
        if (!parentOf.has(targetId)) parentOf.set(targetId, step.id);
      }
    }
    return steps.map((step) => ({ id: step.id, label: step.label, parentId: parentOf.get(step.id) }));
  }, [steps]);

  const edges = useMemo<NodeLinkGraphEdge[]>(
    () => steps.flatMap((step) => (step.next ?? []).map((targetId) => ({ source: step.id, target: targetId }))),
    [steps],
  );

  return (
    <NodeLinkGraph
      className={clsx("rebar-flowchart", className)}
      data-rebar-component="flowchart"
      nodes={nodes}
      edges={edges}
      layout="hierarchical"
      title={title}
      ariaLabel={ariaLabel}
      width={width}
      height={height}
      padding={padding}
      renderNode={(node) => {
        const shape = shapeById.get(node.id) ?? "process";
        const fill = node.color ?? "var(--rebar-color-bg-primary, #ffffff)";
        const stroke = "var(--rebar-color-border-strong, #333333)";
        const label = (
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="var(--rebar-font-size-sm, 12px)"
            fill="var(--rebar-color-text-primary, #212121)"
          >
            {node.label}
          </text>
        );

        if (shape === "decision") {
          // A diamond via 4 plain arithmetic points (no trig involved) — top, right, bottom, left.
          const points = [
            `0,${-DECISION_HALF_HEIGHT}`,
            `${DECISION_HALF_WIDTH},0`,
            `0,${DECISION_HALF_HEIGHT}`,
            `${-DECISION_HALF_WIDTH},0`,
          ].join(" ");
          return (
            <>
              <polygon points={points} fill={fill} stroke={stroke} strokeWidth={1.5} data-rebar-part="node-shape-decision" />
              {label}
            </>
          );
        }

        if (shape === "start-end") {
          // A pill/oval: a rect whose rx/ry equal half its height, rounding the ends into a full
          // stadium shape.
          return (
            <>
              <rect
                x={-NODE_WIDTH / 2}
                y={-NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={NODE_HEIGHT / 2}
                ry={NODE_HEIGHT / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
                data-rebar-part="node-shape-start-end"
              />
              {label}
            </>
          );
        }

        // "process" (default): a plain rounded rect, matching NodeLinkGraph's own default look.
        return (
          <>
            <rect
              x={-NODE_WIDTH / 2}
              y={-NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={6}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
              data-rebar-part="node-shape-process"
            />
            {label}
          </>
        );
      }}
      {...props}
    />
  );
}
