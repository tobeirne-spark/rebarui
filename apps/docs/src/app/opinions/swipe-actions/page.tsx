"use client";

import { Box, Heading, Stack, SwipeActions, Text } from "rebar-ui";
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
        code: `<SwipeActions\n  actions={[\n    { label: "Archive", onSelect: () => {} },\n    { label: "Delete", destructive: true, onSelect: () => {} },\n  ]}\n>\n  <Text>Swipe me left</Text>\n</SwipeActions>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SwipeActions"] ?? [] },
  {
    type: "doc-section",
    heading: "A real, bidirectional non-drag fallback",
    body: [
      {
        kind: "text",
        text: 'A swipe-only reveal would leave a mouse/keyboard user with zero access to the actions underneath, even though each renders as a real, keyboard-focusable button (ref/HEURISTICS.md #38). A small, always-visible "more actions" kebab button is pinned to the row\'s trailing edge, independent of the swipe transform — it toggles the exact same open/closed state a completed swipe reaches, opening and closing it, not just a one-way escape hatch.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "No spring physics — a plain CSS transition",
    body: [
      {
        kind: "text",
        text: "Past roughly 40% of the actions' total width, release snaps fully open; otherwise it springs back closed via a plain CSS transition, not a real physics simulation — the same low-fidelity gesture-handling discipline `BottomSheet`'s own drag handle already applies.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="swipe-actions"`; parts: `content`, `actions`, `action` (destructive ones carry `data-rebar-destructive`), `toggle`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD (the web-focused library) has no direct equivalent — swipe-to-reveal list actions are a mobile-native pattern (Gmail/iOS Mail's own row swipe). antd-mobile's `SwipeAction` is the closer sibling library if the migration target is genuinely mobile.",
      },
    ],
  },
];

export default function SwipeActionsPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>SwipeActions</Heading>
      <Text color="secondary">
        Swipe a list row left to reveal actions — or use the always-visible kebab button instead.
      </Text>

      <LivePreview>
        <Stack gap="sm" style={{ maxWidth: 320 }}>
          <SwipeActions
            actions={[
              { label: "Archive", onSelect: () => {} },
              { label: "Delete", destructive: true, onSelect: () => {} },
            ]}
          >
            <Box style={{ padding: "var(--rebar-space-md)", border: "1px solid var(--rebar-color-border, #e0e0e0)" }}>
              <Text size="sm">Q3 planning notes</Text>
            </Box>
          </SwipeActions>
          <SwipeActions
            actions={[
              { label: "Star", onSelect: () => {} },
              { label: "Delete", destructive: true, onSelect: () => {} },
            ]}
          >
            <Box style={{ padding: "var(--rebar-space-md)", border: "1px solid var(--rebar-color-border, #e0e0e0)" }}>
              <Text size="sm">Weekly status update</Text>
            </Box>
          </SwipeActions>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
