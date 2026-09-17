"use client";

import { useState } from "react";
import { Heading, LayersPanel, Stack, Text } from "rebar-ui";
import type { LayerNode } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const INITIAL_LAYERS: LayerNode[] = [
  {
    id: "group-1",
    name: "Header group",
    children: [
      { id: "layer-a", name: "Logo" },
      { id: "layer-b", name: "Nav links", locked: true },
    ],
  },
  { id: "layer-c", name: "Background", hidden: true },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<LayersPanel\n  layers={layers}\n  onToggleLocked={(id, locked) => toggleLocked(id, locked)}\n  onToggleHidden={(id, hidden) => toggleHidden(id, hidden)}\n  onReorder={(draggedId, targetId, position) => reorder(draggedId, targetId, position)}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["LayersPanel"] ?? [] },
  {
    type: "doc-section",
    heading: "Real drag-reorder, with a keyboard fallback that's always available",
    body: [
      {
        kind: "text",
        text: 'Drop position is computed from where the drag lands on a row — a top/bottom edge means "before"/"after"; the middle half of a group row means "inside" it. Every row also renders real, independently focusable Move up/down buttons — never a hidden modifier-key gesture — as the required non-drag fallback (heuristic #38).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Inline rename via the real Editable component",
    body: [
      {
        kind: "text",
        text: "No hand-rolled inline-edit state — each row's name is a real Editable field, the same click-to-edit convention Card's own editable title already uses.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="layers-panel"`, `role="tree"`; rows carry `data-rebar-part="group" | "layer"` and `data-rebar-drop-position` while a drag is over them.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Tree` (with `draggable`) + a custom row renderer for the lock/hide toggles.",
      },
    ],
  },
];

export default function LayersPanelPage() {
  const [layers, setLayers] = useState(INITIAL_LAYERS);

  return (
    <Stack gap="lg">
      <Heading level={1}>LayersPanel</Heading>
      <Text color="secondary">
        A nested tree of layers/groups with indent/outdent, drag-to-reorder, inline rename, and
        per-row lock/hide toggles.
      </Text>

      <LayersPanel
        layers={layers}
        aria-label="Layers"
        onToggleLocked={(id, locked) => {
          function toggle(nodes: LayerNode[]): LayerNode[] {
            return nodes.map((n) => (n.id === id ? { ...n, locked } : { ...n, children: n.children ? toggle(n.children) : n.children }));
          }
          setLayers(toggle(layers));
        }}
        onToggleHidden={(id, hidden) => {
          function toggle(nodes: LayerNode[]): LayerNode[] {
            return nodes.map((n) => (n.id === id ? { ...n, hidden } : { ...n, children: n.children ? toggle(n.children) : n.children }));
          }
          setLayers(toggle(layers));
        }}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
