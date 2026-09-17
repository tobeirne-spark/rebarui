"use client";

import { useState } from "react";
import { Stack, Tag, Heading, Text } from "rebar-ui";
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
        code: '<Tag>Default</Tag>\n<Tag tone="success">Active</Tag>\n<Tag tone="error" closable onClose={handleRemove}>Removable</Tag>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Tag"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "The close affordance is a real `<button>` with an `aria-label` of \"Remove\" (no visible label text needed for the × glyph) — Tab to focus, Enter/Space to activate.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="tag"`, `data-rebar-tone`, `data-rebar-part="label" | "close"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Tag` uses a `color` prop with either a named preset or a raw hex value, not a fixed `tone` union, so this is a semantic remap (`tone=\"success\"` → `color=\"success\"`, etc.) rather than a mechanical rename. `closable`/`onClose` map directly.",
      },
    ],
  },
];

export default function TagPage() {
  const [tags, setTags] = useState(["React", "TypeScript", "Radix"]);

  return (
    <Stack gap="lg">
      <Heading level={1}>Tag</Heading>
      <Text color="secondary">
        A small labeled chip for status or category. Five tones (default and the four semantic
        tones shared with <code>Alert</code>/<code>Badge</code>), and an optional close button.
      </Text>

      <LivePreview>
        <Stack gap="md">
          <Stack direction="row" gap="sm">
            <Tag>Default</Tag>
            <Tag tone="info">Info</Tag>
            <Tag tone="success">Active</Tag>
            <Tag tone="warning">Pending</Tag>
            <Tag tone="error">Archived</Tag>
          </Stack>
          <Stack direction="row" gap="sm">
            {tags.map((tag) => (
              <Tag key={tag} closable onClose={() => setTags((t) => t.filter((x) => x !== tag))}>
                {tag}
              </Tag>
            ))}
          </Stack>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
