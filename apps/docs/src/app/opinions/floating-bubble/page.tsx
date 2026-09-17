"use client";

import { FloatingBubble, Heading, Stack, Text } from "rebar-ui";
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
        code: '<FloatingBubble\n  axis="xy"\n  magnetic="x"\n  style={{ bottom: 24, right: 24 }}\n  onClick={() => console.log("tapped")}\n>\n  ?\n</FloatingBubble>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["FloatingBubble"] ?? [] },
  {
    type: "doc-section",
    heading: "Position it with normal CSS — the drag offset layers on top",
    body: [
      {
        kind: "text",
        text: 'Set a base position with `style`/`className` (`position: fixed` is already applied — just add `bottom`/`right`/`top`/`left`); the drag offset is a `transform: translate()` on top of that, never replacing it. A real click and a drag are told apart by total pointer movement, not just release timing, so tapping still works fine after the bubble\'s been dragged around.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="floating-bubble"`.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Ant Design (web) has no direct equivalent — this ports antd-**mobile**'s `FloatingBubble`. A migration typically hand-rolls the same pointer-drag-plus-magnetic-snap pattern, or drops the drag affordance for a fixed-position button if the design doesn't need it.",
      },
    ],
  },
];

export default function FloatingBubblePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>FloatingBubble</Heading>
      <Text color="secondary">
        A single clickable bubble the user can drag anywhere on screen, optionally snapping
        magnetically to the nearest edge on release.
      </Text>

      <LivePreview>
        <div
          style={{
            position: "relative",
            height: 160,
            border: "1px solid var(--rebar-color-border)",
            overflow: "hidden",
          }}
        >
          <FloatingBubble axis="xy" magnetic="x" style={{ position: "absolute", top: 16, left: 16 }}>
            ?
          </FloatingBubble>
        </div>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
