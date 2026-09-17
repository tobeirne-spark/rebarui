import { Heading, Stack, Switch, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Switch defaultChecked aria-label="Enable notifications" />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Switch"] ?? [] },
  {
    type: "doc-section",
    heading: "A form-field boolean, distinct from Toggle",
    body: [
      {
        kind: "text",
        text: '`Switch` always shows a track/thumb — a settings-page boolean (`checked`/`defaultChecked`/`onCheckedChange`, the real Radix switch). Distinct from `Toggle` (a single pressable toolbar button remembering on/off via `aria-pressed`, no track/thumb) — reach for `Switch` for a form field, `Toggle` for a toolbar button like Bold/Italic.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="switch"` on the root; `data-rebar-part="thumb"`.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Switch` takes the same `checked`/`onChange` shape — a close, low-risk rename." },
    ],
  },
];

export default function SwitchPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Switch</Heading>
      <Text color="secondary">
        A real Radix on/off switch — a form-field boolean, always showing a track/thumb.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="lg" align="center">
          <Switch defaultChecked aria-label="Enabled example" />
          <Switch aria-label="Disabled-state example" disabled />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
