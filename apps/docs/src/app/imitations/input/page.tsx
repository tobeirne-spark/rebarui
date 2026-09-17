"use client";

import { useState } from "react";
import { Heading, Input, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Input mask="(999) 999-9999" placeholder="(555) 123-4567" />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Input"] ?? [] },
  {
    type: "doc-section",
    heading: "A real formatting mask, not just a validation pattern",
    body: [
      {
        kind: "text",
        text: '`mask` applies as the user types — `9` accepts a digit, `a` a letter, `*` any character, every other character in the mask is a literal auto-inserted at the right position (`"(999) 999-9999"`, `"aaa-9999"`). This is a real, common gap (formatted phone/card-number fields) closed as an `Input` prop rather than a new component. It shapes input, not validates it — pair with `pattern`/`required` for real constraint enforcement (ref/HEURISTICS.md #26: constraints are shown, not just silently enforced).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: 'None — a plain `<input>` with this library\'s own CSS class, carrying every native input attribute directly.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's own `Input` has no built-in mask feature; migrating a masked field means reaching for a dedicated mask library alongside AntD's `Input`.",
      },
    ],
  },
];

export default function InputPage() {
  const [phone, setPhone] = useState("");

  return (
    <Stack gap="lg">
      <Heading level={1}>Input</Heading>
      <Text color="secondary">
        A plain text input with one real extra: an optional typing-time formatting mask.
      </Text>

      <LivePreview>
        <Stack gap="md" style={{ maxWidth: 320 }}>
          <Input placeholder="Plain input" />
          <Input
            mask="(999) 999-9999"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Phone number"
          />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
