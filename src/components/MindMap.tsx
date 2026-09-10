import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { NodeLinkGraph } from "./NodeLinkGraph";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "./NodeLinkGraph";
import type { BionicOptions } from "../bionic";

export interface MindMapChild {
  id: string;
  label: string;
}

export interface MindMapBranch {
  id: string;
  label: string;
  /** One level of sub-branches is enough here — a real mind map's unbounded depth is a nice-to-have,
   * not required by this component. */
  children?: MindMapChild[];
}

export interface MindMapProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** The central node's label. */
  topic: string;
  branches: MindMapBranch[];
  /** Rendered as a real, visible caption above the diagram — see ref/HEURISTICS.md #16. Distinct
   * from `topic`, which is the diagram's own central node label, not its caption. */
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
  /** Force bionic reading on/off for the title, overriding the ambient data-rebar-bionic setting
   * — forwarded to the underlying `NodeLinkGraph`. Branch/child labels render as SVG `<text>`,
   * which `useBionicChildren`'s span-splitting can't target. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

// Internal synthetic id for the central topic node. Unlikely to collide with a caller-supplied
// branch/child id, but even if it did, the worst case is a re-parented node in this one diagram —
// not a crash — since `NodeLinkGraph`'s own hierarchical layout tolerates a `parentId` naming a
// node that doesn't exist (it just falls back to treating that node as a root).
const ROOT_ID = "__mind-map-root__";

/**
 * A radial-reading node diagram — a thin `NodeLinkGraph` specialization built from a central
 * `topic` plus one level of `branches`, each optionally holding its own `children`.
 *
 * **Layout choice: `"hierarchical"`, not `"circular"`, and this was a real comparison, not a
 * default-to-easiest pick.** `NodeLinkGraph`'s `"circular"` layout places every node — including
 * the root — on a single ring, spaced by flat array index with no awareness of parent/child
 * structure at all (see `layoutCircular` in `NodeLinkGraph.tsx`: it takes the whole `nodes` array,
 * not a tree). Handed a topic + branches + children, that layout puts the *topic* itself out on the
 * same ring as its own branches and grandchildren, with nothing left at the actual center — which
 * defeats the one thing a mind map most needs to read correctly: a visually distinct hub.
 * `"hierarchical"` isn't a literal radial burst either (it's rows, not rings), but it does the one
 * thing that matters — it puts the topic alone at the top, its branches on the row below spread
 * across the width, and each branch's children on the row below that — so the actual tree structure
 * (not just array order) drives the picture. That reads as a correct, if literally rectangular
 * rather than circular, mind map; a mis-centered "radial" one does not. Hence `layout="hierarchical"`
 * is hardcoded here rather than exposed as a prop, the same way `OrgChart` hardcodes it for its own
 * always-top-down shape.
 */
export function MindMap({
  topic,
  branches,
  title,
  ariaLabel,
  width = 480,
  height = 360,
  padding,
  bionic,
  bionicOptions,
  className,
  ...props
}: MindMapProps) {
  const nodes = useMemo<NodeLinkGraphNode[]>(() => {
    const result: NodeLinkGraphNode[] = [{ id: ROOT_ID, label: topic }];
    for (const branch of branches) {
      result.push({ id: branch.id, label: branch.label, parentId: ROOT_ID });
      for (const child of branch.children ?? []) {
        result.push({ id: child.id, label: child.label, parentId: branch.id });
      }
    }
    return result;
  }, [topic, branches]);

  const edges = useMemo<NodeLinkGraphEdge[]>(() => {
    const result: NodeLinkGraphEdge[] = [];
    for (const branch of branches) {
      result.push({ source: ROOT_ID, target: branch.id });
      for (const child of branch.children ?? []) {
        result.push({ source: branch.id, target: child.id });
      }
    }
    return result;
  }, [branches]);

  return (
    <NodeLinkGraph
      className={clsx("rebar-mind-map", className)}
      data-rebar-component="mind-map"
      nodes={nodes}
      edges={edges}
      layout="hierarchical"
      title={title}
      ariaLabel={ariaLabel}
      width={width}
      height={height}
      padding={padding}
      bionic={bionic}
      bionicOptions={bionicOptions}
      {...props}
    />
  );
}
