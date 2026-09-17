"use client";

import { useState } from "react";
import { Button, Dropdown, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Dropdown trigger={<Button>Actions</Button>} items={[{ key: "rename", label: "Rename", onSelect: rename }, { key: "delete", label: "Delete", onSelect: remove, danger: true }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Dropdown"] ?? [] },
  {
    type: "doc-section",
    heading: "Click-on-trigger, distinct from ContextMenu",
    body: [
      {
        kind: "text",
        text: 'A real Radix dropdown menu, opened by clicking `trigger` (wrapped via `asChild`, not cloned). Each `item` is `{ key, label, onSelect?, danger?, disabled? }` — the same shape `ContextMenu`\'s own actions use, so migrating a menu from click-triggered to right-click-triggered (or back) needs no data reshaping, just a different component.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="dropdown"` on the content; `data-rebar-part="item"` per row, `data-rebar-danger` on destructive items.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Dropdown` takes a `menu={{ items }}` shape with similar per-item fields — a close, low-risk rename." },
    ],
  },
];

export default function DropdownPage() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>Dropdown</Heading>
      <Text color="secondary">
        A real Radix dropdown menu, opened by clicking its trigger.
      </Text>

      <LivePreview>
        <Stack gap="sm" style={{ alignItems: "flex-start" }}>
          <Dropdown
            trigger={<Button>Actions</Button>}
            items={[
              { key: "rename", label: "Rename", onSelect: () => setLastAction("Rename") },
              { key: "duplicate", label: "Duplicate", onSelect: () => setLastAction("Duplicate") },
              { key: "delete", label: "Delete", onSelect: () => setLastAction("Delete"), danger: true },
            ]}
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
