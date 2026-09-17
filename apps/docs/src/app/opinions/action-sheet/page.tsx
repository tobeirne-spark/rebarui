"use client";

import { ActionSheet, Button, Heading, Stack, Text } from "rebar-ui";
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
        code: `<ActionSheet\n  trigger={<Button>Post options</Button>}\n  title="Post options"\n  actions={[\n    { label: "Share", onSelect: () => {} },\n    { label: "Rename", onSelect: () => {} },\n    { label: "Delete", destructive: true, onSelect: () => {} },\n  ]}\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ActionSheet"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "Built on the same `Drawer`/Radix Dialog wiring as `BottomSheet` — focus trapped while open, Esc closes it, backdrop click closes it. Every action renders as a real, full-width button at least 44px tall (ref/HEURISTICS.md #19); selecting any action — or the separate Cancel button — closes the sheet after calling that action's own `onSelect`. The drag handle is decorative only, never the sole way to dismiss (#38).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="action-sheet"` on the panel; `data-rebar-part="actions"` on the action list, `"action"` per button, `"cancel"` on the dismiss button.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no direct equivalent — an action sheet is a mobile-native pattern (iOS `UIActionSheet`, Android bottom sheets, Ionic's `IonActionSheet`), not part of antd proper. The closest antd building block is composing `Dropdown`'s menu items by hand, which loses the bottom-anchored mobile layout and the separate Cancel row this component gives you for free.",
      },
    ],
  },
];

export default function ActionSheetPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ActionSheet</Heading>
      <Text color="secondary">
        A <code>BottomSheet</code>-shaped panel whose content is a fixed list of actions rather
        than arbitrary children — plus a separate, always-visible Cancel button.
      </Text>

      <LivePreview>
        <ActionSheet
          trigger={<Button>Post options</Button>}
          title="Post options"
          actions={[
            { label: "Share", onSelect: () => {} },
            { label: "Rename", onSelect: () => {} },
            { label: "Delete", destructive: true, onSelect: () => {} },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
