"use client";

import { useState } from "react";
import { Heading, Select, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "overnight", label: "Overnight" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Select options={[{ value: "standard", label: "Standard" }]} value={value} onValueChange={setValue} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Select"] ?? [] },
  {
    type: "doc-section",
    heading: "A closed-menu single select",
    body: [
      {
        kind: "text",
        text: 'A real Radix select (a native-feeling closed dropdown, keyboard-typeahead built in). Distinct from `Combobox` (searchable, and via `multiple`, multi-select) and `MultiSelect` (closed-menu multi-select) — `Select` is the plain, single-choice case with no search box.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="select"` on the trigger; `.rebar-select-content` on the popover.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Select` takes `options`/`value`/`onChange` — a close, low-risk rename." },
    ],
  },
];

export default function SelectPage() {
  const [value, setValue] = useState("standard");

  return (
    <Stack gap="lg">
      <Heading level={1}>Select</Heading>
      <Text color="secondary">
        A real Radix single-select dropdown — no search box, the plain closed-menu case.
      </Text>

      <LivePreview>
        <Select options={OPTIONS} value={value} onValueChange={setValue} aria-label="Shipping method" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
