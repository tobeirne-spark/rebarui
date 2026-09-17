import { Heading, Radio, RadioGroup, Stack, Text } from "rebar-ui";
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
        code: '<RadioGroup defaultValue="standard">\n  <Radio value="standard">Standard</Radio>\n  <Radio value="express">Express</Radio>\n</RadioGroup>',
      },
    ],
  },
  { type: "props-table", heading: "RadioGroup props", rows: componentProps["RadioGroup"] ?? [] },
  { type: "props-table", heading: "Radio props", rows: componentProps["Radio"] ?? [] },
  {
    type: "doc-section",
    heading: "A real Radix radiogroup",
    body: [
      {
        kind: "text",
        text: "`RadioGroup` (real `role=\"radiogroup\"`, arrow-key navigation between options) wraps one or more `Radio`s, each rendering as a real, clickable label the same way `Checkbox` does. `value`/`defaultValue`/`onValueChange` on the group, `value`/`disabled` per `Radio`.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="radio-group"` on the group root.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Radio.Group`/`Radio` take the same `value`/`onChange` (event-based) shape — a close, low-risk rename." },
    ],
  },
];

export default function RadioGroupPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>RadioGroup</Heading>
      <Text color="secondary">
        A real Radix radio group — exclusive choice, arrow-key navigation between options.
      </Text>

      <LivePreview>
        <RadioGroup defaultValue="standard" aria-label="Shipping method">
          <Stack gap="sm">
            <Radio value="standard">Standard (5-7 days)</Radio>
            <Radio value="express">Express (2-3 days)</Radio>
            <Radio value="overnight" disabled>
              Overnight (unavailable)
            </Radio>
          </Stack>
        </RadioGroup>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
