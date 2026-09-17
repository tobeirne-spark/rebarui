"use client";

import { Heading, SplitButton, Stack, Text } from "rebar-ui";
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
        code: `<SplitButton\n  label="Save"\n  onClick={() => {}}\n  items={[\n    { label: "Save as draft", onSelect: () => {} },\n    { label: "Save and publish", onSelect: () => {} },\n  ]}\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SplitButton"] ?? [] },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="split-button"` on the root; `data-rebar-part="primary"` on the main button, `"trigger"` on the caret button, `"menu"` on the popover content, `"item"` per secondary action.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Pure composition, no reimplemented menu logic",
    body: [
      {
        kind: "text",
        text: "Built entirely from the real `Button` and `Popover` components — the primary action and the caret each render as a real `Button`, and the secondary-action list is the real `Popover`'s own content. Nothing about positioning or open/close behavior is reimplemented here.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Dropdown.Button` is a very close direct equivalent: `label` maps to its children, `items` maps to `menu.items`, `onClick` maps directly to AntD's own `onClick` on the primary button half.",
      },
    ],
  },
];

export default function SplitButtonPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>SplitButton</Heading>
      <Text color="secondary">
        A primary button with an attached caret button opening a menu of secondary actions,
        rendered as one visually joined unit.
      </Text>

      <LivePreview>
        <SplitButton
          label="Save"
          onClick={() => {}}
          items={[
            { label: "Save as draft", onSelect: () => {} },
            { label: "Save and publish", onSelect: () => {} },
          ]}
        />
      </LivePreview>

      <Stack gap="sm">
        <Text size="sm" color="secondary">
          <code>variant</code> and <code>size</code> pass through to both the primary and caret
          button, the same values <code>Button</code> itself takes.
        </Text>
        <LivePreview>
          <Stack direction="row" gap="md" style={{ flexWrap: "wrap", alignItems: "center" }}>
            <SplitButton
              label="Save"
              variant="secondary"
              onClick={() => {}}
              items={[{ label: "Save as draft", onSelect: () => {} }]}
            />
            <SplitButton
              label="Delete"
              variant="destructive"
              onClick={() => {}}
              items={[{ label: "Delete forever", onSelect: () => {} }]}
            />
            <SplitButton
              label="Save"
              size="sm"
              onClick={() => {}}
              items={[{ label: "Save as draft", onSelect: () => {} }]}
            />
            <SplitButton
              label="Save"
              size="lg"
              onClick={() => {}}
              items={[{ label: "Save as draft", onSelect: () => {} }]}
            />
          </Stack>
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
