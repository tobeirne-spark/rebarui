"use client";

import { useState } from "react";
import { Descriptions, Heading, Stack, Text } from "rebar-ui";
import type { DescriptionItem } from "rebar-ui";
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
        code: '<Descriptions\n  title="Project details"\n  column={2}\n  items={[\n    { label: "Team", value: "Engineering" },\n    { label: "Lead", value: "Priya Shah" },\n    { label: "Status", value: "Active", span: 2 },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Descriptions"] ?? [] },
  {
    type: "doc-section",
    heading: "Editable values, per item",
    body: [
      {
        kind: "text",
        text: "Setting `editable` on a specific item makes its value click-to-edit via the real `Editable` component, instead of static text — not all-or-nothing: a computed/derived field can sit right next to an editable one. Requires the item's own `value` to be a plain string; a non-string value stays static even with `editable` set, the same no-op (not a crash) convention `Card`'s own editable `title` follows. `onItemChange(index, newValue)` fires on commit — required for the edit to actually persist anywhere, since `Descriptions` itself holds no state of its own.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "A real `<dl>` with a `<dt>`/`<dd>` pair per item — the same semantic structure a screen reader already understands as label/value data, not a table or a plain grid of divs pretending to be one.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="descriptions"`, `data-rebar-part="title" | "item"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Descriptions` uses nested `Descriptions.Item` children rather than a flat `items` array, and its `column` can be a responsive object (breakpoint → count) rather than a single number — a structural rewrite, not a mechanical rename.",
      },
    ],
  },
];

export default function DescriptionsPage() {
  const [editableItems, setEditableItems] = useState<DescriptionItem[]>([
    { label: "Team", value: "Engineering", editable: true },
    { label: "Lead", value: "Priya Shah", editable: true },
    { label: "Started", value: "2026-01-15" },
    { label: "Status", value: "Active" },
  ]);

  return (
    <Stack gap="lg">
      <Heading level={1}>Descriptions</Heading>
      <Text color="secondary">
        A label/value grid for structured data — a details view, not a form, though individual
        values can be made click-to-edit via <code>editable</code>. Each item can span more than
        one column via <code>span</code>.
      </Text>

      <LivePreview>
        <Descriptions
          title="Project details"
          column={2}
          items={[
            { label: "Team", value: "Engineering" },
            { label: "Lead", value: "Priya Shah" },
            { label: "Started", value: "2026-01-15" },
            { label: "Status", value: "Active" },
            { label: "Description", value: "Redesign of the public marketing site.", span: 2 },
          ]}
        />
      </LivePreview>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          <code>Team</code> and <code>Lead</code> below are <code>editable</code> — click either
          value to edit it in place. <code>Started</code>/<code>Status</code> stay plain.
        </Text>
        <LivePreview>
          <Descriptions
            title="Project details (editable)"
            column={2}
            items={editableItems}
            onItemChange={(index, newValue) =>
              setEditableItems((prev) =>
                prev.map((item, i) => (i === index ? { ...item, value: newValue } : item)),
              )
            }
          />
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
