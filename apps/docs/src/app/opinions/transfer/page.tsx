"use client";

import { useState } from "react";
import { Heading, Stack, Text, Transfer } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const ITEMS = [
  { key: "priya", label: "Priya Shah" },
  { key: "marcus", label: "Marcus Webb" },
  { key: "jordan", label: "Jordan Lee" },
  { key: "alex", label: "Alex Kim" },
  { key: "sam", label: "Sam Ortiz" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `const [selected, setSelected] = useState<string[]>([]);\n\n<Transfer\n  items={items}\n  value={selected}\n  onValueChange={setSelected}\n  sourceTitle="Available"\n  targetTitle="Reviewers"\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Transfer"] ?? [] },
  {
    type: "doc-section",
    heading: "What the component's own state tracks",
    body: [
      {
        kind: "text",
        text: "`value`/`defaultValue`/`onValueChange` is the source of truth for which side an item lives on. The component's own internal state is only which items are currently *checked* in each panel — a separate, smaller concern from placement, cleared after each move.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="transfer"`; `data-rebar-part="source-panel"|"target-panel"|"actions"|"move-to-target"|"move-to-source"|"panel-header"|"panel-list"|"panel-row"|"panel-empty"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Transfer` is a close direct equivalent — `items`/`value`/`onValueChange` map to AntD's `dataSource`/`targetKeys`/`onChange`, and `sourceTitle`/`targetTitle` map to AntD's `titles` tuple.",
      },
    ],
  },
];

export default function TransferPage() {
  const [selected, setSelected] = useState<string[]>(["priya"]);

  return (
    <Stack gap="lg">
      <Heading level={1}>Transfer</Heading>
      <Text color="secondary">
        A dual-list widget for moving items between two lists — check items on one side, then
        move them across.
      </Text>

      <Transfer
        items={ITEMS}
        value={selected}
        onValueChange={setSelected}
        sourceTitle="Available"
        targetTitle="Reviewers"
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
