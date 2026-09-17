"use client";

import { FloatingPanel, Heading, Stack, Text } from "rebar-ui";
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
        code: '<FloatingPanel anchors={[80, 260, 480]} header={<Heading level={3}>Directions</Heading>}>\n  <Text size="sm">Panel content goes here.</Text>\n</FloatingPanel>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["FloatingPanel"] ?? [] },
  {
    type: "doc-section",
    heading: "A fixed set of anchors, not a free-form resize",
    body: [
      {
        kind: "text",
        text: "Drag the handle bar to any height, and it snaps to the nearest value in `anchors` on release — the same map-details-panel pattern antd-mobile's `FloatingPanel` is built for. `handleDraggingOfContent` (on by default) also lets a drag inside the content area move the panel, but only once the content is scrolled to its own top edge and the drag continues in the collapsing direction, so it never fights a normal scroll.",
      },
      {
        kind: "text",
        text: 'The handle is a real, keyboard-operable `role="slider"` (Arrow keys jump between anchors, Home/End jump to the smallest/largest) — dragging is an addition to that, never the only way to resize it (ref/HEURISTICS.md #38).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="floating-panel"`; `data-rebar-dragging`; `data-rebar-part="handle"|"content"`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Ant Design (web) has no direct equivalent — this ports antd-**mobile**'s `FloatingPanel`. A migration typically hand-rolls the same anchor-snap drag pattern, or a fixed `Drawer` if the multi-height behavior isn't actually needed.",
      },
    ],
  },
];

export default function FloatingPanelPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>FloatingPanel</Heading>
      <Text color="secondary">
        A bottom (or top) sheet the user drags freely between a fixed set of anchor heights,
        snapping to the nearest one on release.
      </Text>

      <LivePreview>
        <div
          style={{
            position: "relative",
            height: 360,
            border: "1px solid var(--rebar-color-border)",
            overflow: "hidden",
            background: "var(--rebar-color-bg-secondary)",
          }}
        >
          <FloatingPanel
            anchors={[80, 200, 320]}
            defaultHeight={200}
            style={{ position: "absolute" }}
            header={<Heading level={3}>Directions</Heading>}
          >
            <Text size="sm">Drag the bar above (or focus it and use Arrow keys) to resize.</Text>
          </FloatingPanel>
        </div>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
