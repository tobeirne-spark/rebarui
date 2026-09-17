import { Heading, NumberInput, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<NumberInput defaultValue={1} min={0} max={10} aria-label="Quantity" />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["NumberInput"] ?? [] },
  {
    type: "doc-section",
    heading: "Constraints stay visible and enforced",
    body: [
      {
        kind: "text",
        text: "Both the typed value and the stepper buttons clamp to `min`/`max` — the increment/decrement button at a boundary disables itself rather than silently doing nothing (see [Design Heuristics](/about/agent) heuristic #26, input constraints are visible).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="number-input"`; `data-rebar-part` is `"decrement"`, `"input"`, or `"increment"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `InputNumber` is the structural equivalent, but its prop names (`min`/`max`/`step` match, but formatting/parser callbacks don't) require a hand check, not a mechanical rename.",
      },
    ],
  },
];

export default function NumberInputPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>NumberInput</Heading>
      <Text color="secondary">
        A numeric field with increment/decrement steppers — a plain text input underneath, not{" "}
        <code>type=&quot;number&quot;</code>, whose native spinner is inconsistent across browsers
        and unstyleable.
      </Text>

      <LivePreview>
        <NumberInput defaultValue={5} min={0} max={10} aria-label="Quantity" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
