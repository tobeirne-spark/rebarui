"use client";

import { useState } from "react";
import { Heading, Input, SlashCommandMenu, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const COMMANDS = [
  { key: "text", label: "Text", description: "Plain paragraph text", category: "Basic blocks", onSelect: () => {} },
  { key: "heading", label: "Heading", description: "A section heading", category: "Basic blocks", onSelect: () => {} },
  { key: "image", label: "Image", description: "Embed an image", category: "Media", onSelect: () => {} },
  { key: "video", label: "Video", description: "Embed a video", category: "Media", onSelect: () => {} },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      { kind: "code", code: '<SlashCommandMenu commands={commands} query={query} onClose={close} />' },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SlashCommandMenu"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from CommandPalette and Mentions",
    body: [
      {
        kind: "text",
        text: 'CommandPalette is a global, keyboard-shortcut-triggered overlay; Mentions is a flat @-mention autocomplete. SlashCommandMenu is categorized (grouped headings) and icon+description rich, meant to appear inline while typing "/" inside an editor. Presentational — the caller tracks the trigger and the query text typed after it.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="slash-command-menu"`; parts include `category-heading` and `command`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no inline slash-command primitive; compose `Dropdown`/`Menu` positioned at the caret manually.",
      },
    ],
  },
];

export default function SlashCommandMenuPage() {
  const [query, setQuery] = useState("");

  return (
    <Stack gap="lg">
      <Heading level={1}>SlashCommandMenu</Heading>
      <Text color="secondary">
        A Notion-style inline &quot;/&quot; command menu, categorized with icon+description rows.
      </Text>

      <Input
        placeholder="Type to filter…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ maxWidth: 280 }}
      />
      <SlashCommandMenu commands={COMMANDS} query={query} onClose={() => setQuery("")} />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
