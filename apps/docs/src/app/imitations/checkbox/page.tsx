import { Checkbox, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: "<Checkbox>Email me updates</Checkbox>" }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Checkbox"] ?? [] },
  {
    type: "doc-section",
    heading: "A real Radix checkbox, label included",
    body: [
      {
        kind: "text",
        text: "`children` renders as the real, clickable `<label>` wrapping the control — the whole row toggles, not just the small box, matching this project's own real-touch-target discipline. Supports Radix's own `checked`/`defaultChecked`/`onCheckedChange` (including the tri-state `\"indeterminate\"` value, used by `Table`'s own \"select all\" header checkbox) and `disabled`.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="checkbox"` on the control; `data-rebar-part="indicator"` on the checkmark.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Checkbox` takes the same `checked`/`onChange` shape (event-based, not value-based) and `children` as its label — a close, low-risk rename." },
    ],
  },
];

export default function CheckboxPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Checkbox</Heading>
      <Text color="secondary">
        A real Radix checkbox with the entire row, not just the box, as the clickable target.
      </Text>

      <LivePreview>
        <Stack gap="sm">
          <Checkbox defaultChecked>Email me updates</Checkbox>
          <Checkbox>Unchecked</Checkbox>
          <Checkbox checked="indeterminate">Indeterminate (partial selection)</Checkbox>
          <Checkbox disabled>Disabled</Checkbox>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
