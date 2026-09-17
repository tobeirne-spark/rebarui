import { Heading, NodeLinkGraph, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<NodeLinkGraph\n  layout="hierarchical"\n  nodes={[{ id: "ceo", label: "CEO" }, { id: "cto", label: "CTO", parentId: "ceo" }, { id: "cfo", label: "CFO", parentId: "ceo" }]}\n  edges={[{ source: "ceo", target: "cto" }, { source: "ceo", target: "cfo" }]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["NodeLinkGraph"] ?? [] },
  {
    type: "doc-section",
    heading: "Deterministic layouts, not force-directed physics",
    body: [
      {
        kind: "text",
        text: '`layout` picks one of three deterministic algorithms — `"hierarchical"` (a top-down tree from each node\'s own `parentId`), `"circular"` (evenly spaced by array index), or `"manual"` (the caller supplies explicit `x`/`y`, e.g. after a drag). This deliberately does not implement real force-directed physics simulation — a genuinely hard, iterative algorithm out of scope for this project\'s low-fidelity philosophy. Node-drag repositioning only applies in `"manual"` layout — dragging in the other two modes would just get overwritten by the deterministic layout on the next render, so it\'s disabled there rather than silently fighting itself.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A \"floaty\" default node look — visual only, not a layout change",
    body: [
      {
        kind: "text",
        text: 'The default node renders as a solid-colored circle with a soft drop shadow and its label below it — closer to the Neo4j Bloom convention people actually expect from a node-link graph specifically, replacing the earlier bordered white box with centered text. This is purely cosmetic: positioning is exactly as deterministic as before (see the layout section above); a caller-supplied `renderNode` (as `OrgChart`/`Flowchart` both use for their own box/diamond/pill shapes) is completely unaffected.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A real non-gesture zoom fallback",
    body: [
      {
        kind: "text",
        text: "Zoom works via mouse-wheel and via two real, always-visible +/- buttons (ref/HEURISTICS.md #38 — a scroll-only zoom would be inaccessible). Panning drags the background; dragging a node (in manual layout) is ignored on the background pan handler so the two never conflict.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The foundation for other diagram archetypes",
    body: [
      {
        kind: "text",
        text: "`OrgChart`, `MindMap`, `Flowchart`, and `DiagramMinimap` are all built on top of this component rather than reimplementing pan/zoom/drag/layout each time — see their own reference pages for how each one specializes `NodeLinkGraph` for its own shape.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Bionic reading on node/edge labels",
    body: [
      {
        kind: "text",
        text: 'Node/edge labels render as SVG `<text>`, which the ordinary `useBionicChildren` hook can\'t target at all — a plain HTML `<span>` is invalid content inside SVG `<text>`. The default label rendering is wired through a dedicated SVG-aware renderer instead (`renderBionicSvgText`, from the same `bionic.tsx` module), splitting each word into real `<tspan>` elements. A caller-supplied `renderNode` draws its own `<text>` and is responsible for its own bionic wiring — this only covers the default node rendering, which is what `MindMap` (no custom `renderNode`) relies on; `OrgChart`/`Flowchart` wire it themselves in their own `renderNode`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="node-link-graph"`; parts: `toolbar`, `zoom-out-button`, `zoom-label`, `zoom-in-button`, `pan-zoom-container`, `node` (also carrying `data-node-id`), `edge`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no diagramming components of its own; a node-link graph typically migrates to a dedicated library (React Flow, Cytoscape.js) rather than an antd component.",
      },
    ],
  },
];

export default function NodeLinkGraphPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>NodeLinkGraph</Heading>
      <Text color="secondary">
        An interactive canvas of nodes and edges — pan, zoom, and (in manual layout) drag — with
        deterministic hierarchical/circular/manual layouts, not force-directed physics.
      </Text>

      <LivePreview>
        <NodeLinkGraph
          layout="hierarchical"
          title="Reporting structure"
          nodes={[
            { id: "ceo", label: "CEO" },
            { id: "cto", label: "CTO", parentId: "ceo" },
            { id: "cfo", label: "CFO", parentId: "ceo" },
            { id: "eng1", label: "Eng Lead", parentId: "cto" },
            { id: "eng2", label: "Platform Lead", parentId: "cto" },
          ]}
          edges={[
            { source: "ceo", target: "cto" },
            { source: "ceo", target: "cfo" },
            { source: "cto", target: "eng1" },
            { source: "cto", target: "eng2" },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
