"use client";

import { useState } from "react";
import { Button, Dialog, DiagramMinimap, Heading, NodeLinkGraph, Stack, Text } from "rebar-ui";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// A small, static pairing for the always-visible example below — illustrates the shape without
// needing the dialog.
const WORKFLOW_NODES: NodeLinkGraphNode[] = [
  { id: "kickoff", label: "Kickoff", x: 280, y: 30 },
  { id: "design", label: "Design", x: 140, y: 140 },
  { id: "dev", label: "Development", x: 420, y: 140 },
  { id: "wireframes", label: "Wireframes", x: 70, y: 250 },
  { id: "visual-qa", label: "Visual QA", x: 210, y: 250 },
  { id: "backend", label: "Backend", x: 350, y: 250 },
  { id: "frontend", label: "Frontend", x: 490, y: 250 },
  { id: "launch", label: "Launch", x: 280, y: 350 },
];

const WORKFLOW_EDGES: NodeLinkGraphEdge[] = [
  { source: "kickoff", target: "design" },
  { source: "kickoff", target: "dev" },
  { source: "design", target: "wireframes" },
  { source: "design", target: "visual-qa" },
  { source: "dev", target: "backend" },
  { source: "dev", target: "frontend" },
  { source: "wireframes", target: "launch" },
  { source: "visual-qa", target: "launch", label: "approved" },
  { source: "backend", target: "launch" },
  { source: "frontend", target: "launch", label: "shipped" },
];

const ILLUSTRATIVE_VIEWPORT = { x: 20, y: 0, width: 520, height: 210 };

// A genuinely large org tree — 4 levels deep, ~30 people — that doesn't fit in one small
// NodeLinkGraph viewport without panning/zooming, so the minimap actually has a real job to do
// (summarizing content the viewer can't see all of at once), not just a handful of dots that
// would fit in the visible area anyway.
function buildLargeOrg(): { nodes: NodeLinkGraphNode[]; edges: NodeLinkGraphEdge[] } {
  const nodes: NodeLinkGraphNode[] = [{ id: "ceo", label: "CEO" }];
  const edges: NodeLinkGraphEdge[] = [];
  const depts = ["Engineering", "Design", "Sales", "Marketing", "Support"];
  depts.forEach((dept, i) => {
    const vpId = `vp-${i}`;
    nodes.push({ id: vpId, label: `VP ${dept}`, parentId: "ceo" });
    edges.push({ source: "ceo", target: vpId });
    for (let j = 0; j < 5; j++) {
      const mgrId = `${vpId}-mgr-${j}`;
      nodes.push({ id: mgrId, label: `${dept} Mgr ${j + 1}`, parentId: vpId });
      edges.push({ source: vpId, target: mgrId });
    }
  });
  return { nodes, edges };
}

const { nodes: LARGE_ORG_NODES, edges: LARGE_ORG_EDGES } = buildLargeOrg();

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: 'const [view, setView] = useState<{ nodes: {id,x,y}[]; viewportBounds: {...} }>();\n\n<NodeLinkGraph\n  nodes={nodes}\n  edges={edges}\n  onViewportChange={setView}\n/>\n<DiagramMinimap nodes={view?.nodes ?? []} viewportBounds={view?.viewportBounds} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["DiagramMinimap"] ?? [] },
  {
    type: "doc-section",
    heading: "Designed to pair with NodeLinkGraph, not built on it",
    body: [
      {
        kind: "text",
        text: "This is a genuinely standalone, static component — it runs no layout or interaction logic of its own, just draws a dot per already-resolved node position, scaled into a small frame. It's *designed* to pair with a `NodeLinkGraph` (or any similar pannable canvas) elsewhere on the page by sharing the same coordinate data — the caller feeds it the same node positions and current viewport rect the real canvas is using — not because it wraps one internally. `NodeLinkGraph`'s own `onViewportChange` prop is the supported way to get that data live: it fires with every resolved node's position plus the currently-visible region (derived by inverting the live pan/zoom transform), both in the same coordinate space `DiagramMinimap` expects.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="diagram-minimap"` on the root `<figure>`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no diagramming components of its own; a minimap/overview navigator typically migrates as part of whichever dedicated canvas library (React Flow, AntV X6) the paired main diagram uses.",
      },
    ],
  },
];

interface LiveView {
  nodes: { id: string; x: number; y: number }[];
  viewportBounds: { x: number; y: number; width: number; height: number };
}

export default function DiagramMinimapPage() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<LiveView | null>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>DiagramMinimap</Heading>
      <Text color="secondary">
        A small, static thumbnail overview of a large pannable canvas — a dot per node, an
        optional viewport highlight.
      </Text>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          A real, functional pairing: a ~30-person org tree too large to see all at once, panned
          and zoomed via <code>NodeLinkGraph</code>'s own controls, with the minimap's highlighted
          rectangle live-synced to whatever&apos;s actually visible — not an illustrative fixed
          rect.
        </Text>
        <Button variant="primary" onClick={() => setOpen(true)} style={{ maxWidth: 220 }}>
          Open live demo
        </Button>
      </Stack>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="NodeLinkGraph + DiagramMinimap, live-synced"
        fullscreen
      >
        <Stack direction="row" gap="lg" style={{ height: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <NodeLinkGraph
              title="Company org chart (30 people)"
              layout="hierarchical"
              width={900}
              height={600}
              nodes={LARGE_ORG_NODES}
              edges={LARGE_ORG_EDGES}
              onViewportChange={setView}
            />
          </div>
          <Stack gap="xs" style={{ width: 220 }}>
            <DiagramMinimap
              title="Minimap"
              width={200}
              height={150}
              nodes={view?.nodes ?? []}
              viewportBounds={view?.viewportBounds}
            />
            <Text size="xs" color="secondary">
              Pan (drag) or zoom (+/− buttons, scroll) the diagram at left — the highlighted
              rectangle above tracks exactly what&apos;s currently visible.
            </Text>
          </Stack>
        </Stack>
      </Dialog>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          A smaller static pairing, for reference — same coordinate data fed to both components,
          viewport shown as an illustrative fixed rect (not live, unlike the demo above).
        </Text>
        <Stack direction="row" gap="lg" align="start" style={{ flexWrap: "wrap" }}>
          <LivePreview>
            <NodeLinkGraph
              layout="manual"
              title="Project workflow"
              width={560}
              height={380}
              nodes={WORKFLOW_NODES}
              edges={WORKFLOW_EDGES}
            />
          </LivePreview>

          <Stack gap="xs" style={{ width: 200 }}>
            <DiagramMinimap
              title="Minimap of the diagram at left"
              width={200}
              height={140}
              nodes={WORKFLOW_NODES.map(({ id, x, y }) => ({ id, x: x ?? 0, y: y ?? 0 }))}
              viewportBounds={ILLUSTRATIVE_VIEWPORT}
            />
          </Stack>
        </Stack>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
