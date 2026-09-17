"use client";

import { useState } from "react";
import { Box, Heading, PullToRefresh, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<PullToRefresh onRefresh={async () => {\n  await fetchLatest();\n}}>\n  <MyScrollableList />\n</PullToRefresh>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PullToRefresh"] ?? [] },
  {
    type: "doc-section",
    heading: "Only triggers from the very top of the scroll",
    body: [
      {
        kind: "text",
        text: "The pull gesture only starts tracking when the wrapped content is genuinely at `scrollTop === 0` the moment the drag begins — checked against the real DOM node, not assumed — so pulling down on already-scrolled content just scrolls normally instead of hijacking the gesture.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A real non-gesture fallback",
    body: [
      {
        kind: "text",
        text: 'A touch-only gesture with no other trigger would be undiscoverable to a mouse/keyboard user (ref/HEURISTICS.md #38) — a small, always-visible "Refresh" button sits in the corner regardless of pull state, firing the same `onRefresh` path a completed pull does.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="pull-to-refresh"`; parts: `scroll-container`, `refresh-button`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD (the web-focused library) has no direct equivalent — pull-to-refresh is a mobile-native pattern (Cupertino's `RefreshControl`, React Native's own). antd-mobile's `PullToRefresh` is the closer sibling library if the migration target is genuinely mobile.",
      },
    ],
  },
];

export default function PullToRefreshPage() {
  const [items, setItems] = useState(["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]);

  return (
    <Stack gap="lg">
      <Heading level={1}>PullToRefresh</Heading>
      <Text color="secondary">
        Drag down from the very top of a scroll area to trigger a refresh — with a real,
        always-visible button as the non-gesture fallback.
      </Text>

      <Box style={{ maxWidth: 320, height: 220, border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4 }}>
        <PullToRefresh
          onRefresh={async () => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            setItems((prev) => [`Refreshed at ${new Date().toLocaleTimeString()}`, ...prev]);
          }}
        >
          <Stack gap="xs" style={{ padding: "var(--rebar-space-md)" }}>
            {items.map((item, i) => (
              <Text key={i} size="sm">
                {item}
              </Text>
            ))}
          </Stack>
        </PullToRefresh>
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
