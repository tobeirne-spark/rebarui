"use client";

import { useState } from "react";
import { Heading, Stack, Text, TreeSelect } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const DATA = [
  {
    value: "engineering",
    label: "Engineering",
    children: [
      { value: "platform", label: "Platform" },
      { value: "frontend", label: "Frontend" },
    ],
  },
  { value: "design", label: "Design" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<TreeSelect data={data} value={value} onValueChange={(value, label) => setValue(value)} placeholder="Select a team" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["TreeSelect"] ?? [] },
  {
    type: "doc-section",
    heading: "Pure composition, no reimplemented tree logic",
    body: [
      {
        kind: "text",
        text: "A trigger button opening a real `Popover` containing the real `TreeView` — no expand/collapse or keyboard navigation logic of its own, the same way `TimePicker` owns no time-grid logic and just composes its own picker shell. Picking a node closes the popover (a single choice is a complete choice). `data` uses the exact same shape `TreeView` itself accepts — a node's id lives on its `value` field.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="tree-select"` on the trigger button; the popover content is a real `TreeView`, carrying its own attributes.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `TreeSelect` is a close direct equivalent — `value`/`onValueChange` map to AntD's `value`/`onChange`; `data`'s shape (`value`/`label`/`children`) maps directly to AntD's `treeData` (`value`/`title`/`children`).",
      },
    ],
  },
];

export default function TreeSelectPage() {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <Stack gap="lg">
      <Heading level={1}>TreeSelect</Heading>
      <Text color="secondary">
        A trigger button opening a popover of the real <code>TreeView</code> component.
      </Text>

      <Stack gap="sm" align="start">
        <TreeSelect
          data={DATA}
          value={value}
          onValueChange={(nextValue) => setValue(nextValue)}
          placeholder="Select a team"
        />
        <Text size="sm" color="secondary">
          Selected: {value ?? "none"}
        </Text>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
