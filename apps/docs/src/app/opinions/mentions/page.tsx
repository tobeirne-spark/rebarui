"use client";

import { useState } from "react";
import { Heading, Mentions, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const OPTIONS = [
  { id: "priya", label: "Priya Shah" },
  { id: "marcus", label: "Marcus Webb" },
  { id: "jordan", label: "Jordan Lee" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Mentions value={value} onValueChange={setValue} options={[{ id: "priya", label: "Priya Shah" }, /* ... */]} placeholder="Type @ to mention someone" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Mentions"] ?? [] },
  {
    type: "doc-section",
    heading: "Plain text in, plain text out",
    body: [
      {
        kind: "text",
        text: "`value` is the full textarea content as plain text — a mention is written inline as `@name`, there's no separate structured \"list of mentioned ids\" the caller has to keep in sync. Filtering as you type after `@` reuses the same substring-match approach `Combobox` already uses, for consistency.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A stated caret-position simplification",
    body: [
      {
        kind: "text",
        text: "The suggestion dropdown is anchored just below the textarea itself, not at the real pixel position of the text caret — real caret-coordinate tracking in a plain `<textarea>` needs mirroring its content into a hidden, identically-styled element, a genuinely harder problem this component deliberately doesn't take on.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="mentions"`; parts: `input` (the real textarea), `list`, `option` (the highlighted one carries `data-rebar-active`).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Mentions` is a close direct equivalent — `value`/`onValueChange`/`options`/`placeholder` map to AntD's `value`/`onChange`/`options`/`placeholder`.",
      },
    ],
  },
];

export default function MentionsPage() {
  const [value, setValue] = useState("");

  return (
    <Stack gap="lg">
      <Heading level={1}>Mentions</Heading>
      <Text color="secondary">
        An @-mention autocomplete inside a real textarea — type <code>@</code> to see it in
        action.
      </Text>

      <Mentions
        value={value}
        onValueChange={setValue}
        options={OPTIONS}
        placeholder="Type @ to mention someone"
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
