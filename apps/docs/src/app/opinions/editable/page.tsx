import { Editable, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      { kind: "code", code: '<Editable defaultValue="Project Alpha" onSubmit={(v) => rename(v)} aria-label="Project name" />' },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Editable"] ?? [] },
  {
    type: "doc-section",
    heading: "Enter commits, Escape reverts",
    body: [
      {
        kind: "text",
        text: "Escape restores the value the field had *before this edit started*, not just whatever's currently typed — so an accidental Escape after several undone keystrokes never loses more than the current edit session.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'The read-mode display is a real, focusable, keyboard-activatable `<button>` (Enter/Space enters edit mode) — never a bare `<span onClick>` that only a mouse or a screen-reader\'s click-simulation could reach.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="editable"`; `data-rebar-part` is `"display"` (read mode) or `"input"` (edit mode).' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "Not codemod-covered — AntD has no direct equivalent; `Typography.Text editable` is the closest, but its callback shape and edit-trigger prop differ enough to need a hand rewrite." },
    ],
  },
];

export default function EditablePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Editable</Heading>
      <Text color="secondary">
        Click-to-edit text: reads as plain text until activated, then becomes a real input — Enter
        or blur commits, Escape reverts.
      </Text>

      <LivePreview>
        <Editable defaultValue="Project Alpha" aria-label="Project name" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
