"use client";

import { Card, ContextMenu, Heading, Stack, Text } from "rebar-ui";
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
        code: '<ContextMenu\n  items={[\n    { key: "rename", label: "Rename", onSelect: () => {} },\n    { key: "sep", separator: true },\n    { key: "delete", label: "Delete", danger: true, onSelect: () => {} },\n  ]}\n>\n  <Card>Right-click me</Card>\n</ContextMenu>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ContextMenu"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from Dropdown",
    body: [
      {
        kind: "text",
        text: 'Same item vocabulary as `Dropdown` (`key`/`label`/`onSelect`/`danger`/`disabled`, plus a `separator` entry) — the difference is purely trigger and positioning: `Dropdown` is click-triggered and anchored to its own trigger element; `ContextMenu` is right-click-triggered and positioned at the bare cursor coordinate, with no element behind that point for Radix-style anchoring to measure.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Touch fallback: long-press",
    body: [
      {
        kind: "text",
        text: "A touch-and-hold on the wrapped area opens the same menu at the touch point — the real equivalent of a right-click on a device with no such gesture (heuristic #48).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="context-menu"` on the wrapper; the menu carries `data-rebar-part="menu" | "item" | "separator"`, plus `data-rebar-danger` on destructive items.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no dedicated context-menu component of its own; its `Dropdown` supports a `trigger={[\"contextMenu\"]}` mode that's the closest direct equivalent on migration.",
      },
    ],
  },
];

export default function ContextMenuPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ContextMenu</Heading>
      <Text color="secondary">
        A right-click-triggered menu positioned at the cursor.
      </Text>

      <ContextMenu
        items={[
          { key: "rename", label: "Rename", onSelect: () => {} },
          { key: "duplicate", label: "Duplicate", onSelect: () => {} },
          { key: "sep", separator: true },
          { key: "delete", label: "Delete", danger: true, onSelect: () => {} },
        ]}
      >
        <Card style={{ padding: 32, textAlign: "center" }}>
          <Text color="secondary">Right-click (or long-press) here</Text>
        </Card>
      </ContextMenu>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
