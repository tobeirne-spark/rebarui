"use client";

import { Heading, Stack, Text, Toggle } from "rebar-ui";
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
        code: '<Toggle defaultPressed onPressedChange={setBold}>Bold</Toggle>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Toggle"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from Switch and SegmentedControl",
    body: [
      {
        kind: "text",
        text: "`Switch` is a form-field boolean that always shows a track/thumb. `SegmentedControl` is an exclusive-choice set of several options rendered as one `radiogroup`. `Toggle` is neither — a single button that looks like a normal button but remembers whether it's \"on\" via `aria-pressed`, the classic Bold/Italic toolbar-button shape.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Icon-only usage needs an aria-label",
    body: [
      {
        kind: "text",
        text: "Same convention as `Button`: if `children` is icon-only with no visible text, pass an explicit `aria-label` yourself — `Toggle` has no built-in fallback label.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="toggle"`, `data-rebar-pressed` (boolean), `data-rebar-size`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'Not codemod-covered — AntD has no direct single-toggle-button primitive of its own (its closest analog is a plain `Button` with `type="primary"` conditionally applied by hand). On migration, a `Toggle` becomes a `Button` whose `type` prop is computed from the pressed state.',
      },
    ],
  },
];

export default function TogglePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Toggle</Heading>
      <Text color="secondary">
        A single pressable on/off button — see <code>ToggleGroup</code> for several of these
        composed together.
      </Text>

      <Stack direction="row" gap="sm">
        <Toggle defaultPressed aria-label="Bold">
          B
        </Toggle>
        <Toggle aria-label="Italic">I</Toggle>
        <Toggle aria-label="Underline">U</Toggle>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
