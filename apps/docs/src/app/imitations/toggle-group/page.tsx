"use client";

import { Heading, Stack, Text, ToggleGroup } from "rebar-ui";
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
        code: '<ToggleGroup\n  type="multiple"\n  items={[\n    { value: "bold", label: "B", "aria-label": "Bold" },\n    { value: "italic", label: "I", "aria-label": "Italic" },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ToggleGroup"] ?? [] },
  {
    type: "doc-section",
    heading: "type=\"single\" vs. type=\"multiple\"",
    body: [
      {
        kind: "text",
        text: '`"single"` behaves like an exclusive choice (picking one clears the others; re-clicking the pressed one clears it) but stays visually and semantically a row of independent toggle buttons — not `SegmentedControl`\'s `radiogroup`/`radio` roles, which is the right shape when the options are one logical field rather than a toolbar. `"multiple"` lets any number stay pressed at once (Bold + Italic + Underline all active together).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "No composite-widget keyboard model",
    body: [
      {
        kind: "text",
        text: 'A deliberate, accepted gap: each item is a real, independently Tab-able `Toggle` — no roving-tabindex/arrow-key composite widget like `SegmentedControl` has. This matches how a real toolbar of independent toggle buttons behaves in the editors this pattern is modeled on.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="toggle-group"`, `data-rebar-toggle-group-type="single" | "multiple"` on the root; each item is a real `Toggle` carrying `data-rebar-part="item"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no direct multi-toggle-button-row primitive; its closest analogs are `Checkbox.Group` (for the `multiple` case) or a manually-built row of `Button`s.",
      },
    ],
  },
];

export default function ToggleGroupPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ToggleGroup</Heading>
      <Text color="secondary">
        Several Toggles composed together — exclusive (single) or independent (multiple).
      </Text>

      <Stack gap="md">
        <ToggleGroup
          type="multiple"
          defaultValue={["bold"]}
          items={[
            { value: "bold", label: "B", "aria-label": "Bold" },
            { value: "italic", label: "I", "aria-label": "Italic" },
            { value: "underline", label: "U", "aria-label": "Underline" },
          ]}
        />

        <ToggleGroup
          type="single"
          defaultValue="left"
          items={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
