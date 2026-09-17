"use client";

import { useState } from "react";
import { GraphExplorer, Heading, Stack, Text } from "rebar-ui";
import type { GraphExplorerEdge, GraphExplorerNode } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const PEOPLE = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Katherine Johnson",
  "Margaret Hamilton",
  "Radia Perlman",
  "Hedy Lamarr",
  "Ida Rhodes",
  "Frances Allen",
  "Shafi Goldwasser",
  "Barbara Liskov",
  "Edsger Dijkstra",
];
const LOCATIONS = ["London", "Cambridge", "New York", "Palo Alto", "Berlin", "Tokyo"];
const VEHICLES = ["Blue Sedan", "White Van", "Grey Coupe", "Black SUV"];

const HIDDEN_PEOPLE = ["Donald Knuth", "Tim Berners-Lee", "Charles Babbage", "Betty Holberton"];

function buildInitialGraph(): { nodes: GraphExplorerNode[]; edges: GraphExplorerEdge[] } {
  const nodes: GraphExplorerNode[] = [];
  const edges: GraphExplorerEdge[] = [];

  PEOPLE.forEach((name, i) => nodes.push({ id: `person-${i}`, label: name, category: "Person" }));
  LOCATIONS.forEach((name, i) => nodes.push({ id: `location-${i}`, label: name, category: "Location" }));
  VEHICLES.forEach((name, i) => nodes.push({ id: `vehicle-${i}`, label: name, category: "Vehicle" }));

  // Each person connects to 1-2 locations and sometimes a vehicle, deterministically fanned out
  // (not random) so the demo is stable across renders.
  PEOPLE.forEach((_, i) => {
    edges.push({ source: `person-${i}`, target: `location-${i % LOCATIONS.length}` });
    if (i % 3 === 0) edges.push({ source: `person-${i}`, target: `location-${(i + 2) % LOCATIONS.length}` });
    if (i % 2 === 0) edges.push({ source: `person-${i}`, target: `vehicle-${i % VEHICLES.length}` });
  });
  // A couple of locations share a vehicle sighting, so the graph isn't purely a star pattern.
  edges.push({ source: `location-0`, target: `vehicle-0` });
  edges.push({ source: `location-2`, target: `vehicle-1` });

  return { nodes, edges };
}

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<GraphExplorer nodes={nodes} edges={edges} title="Investigation network" nodeActions={(node) => [{ label: "Expand", onClick: (n) => loadNeighborsOf(n) }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["GraphExplorer"] ?? [] },
  {
    type: "doc-section",
    heading: "Canvas, not SVG — and a real physics simulation, not a deterministic layout",
    body: [
      {
        kind: "text",
        text: '`NodeLinkGraph` deliberately stays SVG with a handful of deterministic layouts (hierarchical/circular/manual), sized for a few dozen nodes at most. `GraphExplorer` is the sibling for the Neo4j Bloom scale of problem — hundreds to low-thousands of nodes clustered by connectivity, which is exactly what a force simulation (`d3-force`) is for and no fixed layout algorithm reproduces. A thousand-node SVG would mean a thousand real DOM elements; a `<canvas>` renders the same graph as pixels instead.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Search, the legend, and the radial menu are real HTML — only the graph itself is canvas",
    body: [
      {
        kind: "text",
        text: "Everything a keyboard or screen-reader user needs — the search box and its match list, the category legend chips, and the Pin/Close/custom-action buttons that appear on a selected node — are real, focusable HTML elements layered over the canvas, not drawn onto it. Only \"click an arbitrary node directly on the canvas without knowing its name first\" is mouse/touch-only; searching for a node by name and picking it from the results list is the fully keyboard-operable way in. Try it: focus the search box, type a name, and press Tab into the result.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A real, deliberate accessibility gap, stated rather than glossed over",
    body: [
      {
        kind: "text",
        text: "There's no way to Tab through every individual node on the canvas one at a time — building that for a thousands-of-nodes graph would mean a thousand extra DOM elements, defeating the entire reason this isn't `NodeLinkGraph`. Search is the supported way to reach a specific node without a mouse; full node-by-node browsing isn't provided.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="graph-explorer"` on the root; parts: `toolbar`, `search`, `search-results`, `zoom-controls`, `legend`, `legend-chip`, `canvas-wrap`, `canvas`, `radial-menu`, `radial-menu-button`, `status` (the visually-hidden `aria-live` selection announcer).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no force-directed network graph component at all; migrating means reaching for a dedicated graph-visualization library (e.g. AntV G6, from the same Ant ecosystem) directly.",
      },
    ],
  },
];

export default function GraphExplorerPage() {
  const [graph, setGraph] = useState(buildInitialGraph);
  const [expanded, setExpanded] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const expandNeighbors = (node: GraphExplorerNode) => {
    if (expanded) return;
    setExpanded(true);
    setLastAction(`Expanded neighbors of "${node.label}"`);
    setGraph((prev) => {
      const newNodes: GraphExplorerNode[] = HIDDEN_PEOPLE.map((name, i) => ({
        id: `hidden-person-${i}`,
        label: name,
        category: "Person",
      }));
      const newEdges: GraphExplorerEdge[] = HIDDEN_PEOPLE.map((_, i) => ({
        source: node.id,
        target: `hidden-person-${i}`,
      }));
      return { nodes: [...prev.nodes, ...newNodes], edges: [...prev.edges, ...newEdges] };
    });
  };

  return (
    <Stack gap="lg">
      <Heading level={1}>GraphExplorer</Heading>
      <Text color="secondary">
        A force-directed network graph for hundreds to low-thousands of nodes — canvas-rendered,
        clustered by connectivity via a real physics simulation, with a live category legend and
        search-to-select. Try clicking a node (or searching for one), then use its{" "}
        <strong>Expand</strong> action to reveal a few more connections.
      </Text>

      <LivePreview>
        <Stack gap="sm">
          <GraphExplorer
            nodes={graph.nodes}
            edges={graph.edges}
            title="Investigation network"
            width={640}
            height={440}
            nodeActions={() => [{ label: "Expand", onClick: expandNeighbors }]}
          />
          {lastAction ? (
            <Text size="sm" color="secondary">
              Last action: <strong>{lastAction}</strong>
            </Text>
          ) : null}
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
