import { Heading, SegmentedControl, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<SegmentedControl options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }]} defaultValue="week" aria-label="Range" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SegmentedControl"] ?? [] },
  {
    type: "doc-section",
    heading: "vs. RadioGroup",
    body: [
      {
        kind: "text",
        text: "Same underlying choice (`role=\"radiogroup\"`, exactly one selected) as `RadioGroup` — this is a visual variant for when a compact row of labeled segments reads better than a stacked list of radio buttons (a view toggle, a time-range picker), not a different interaction model.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'A real ARIA radio group: arrow keys (not Tab) move the selection between segments, Home/End jump to the first/last, matching the WAI-ARIA Authoring Practices radio-group pattern — the same keyboard model native radio buttons have.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="segmented-control"`; `data-rebar-part="item"` per option, `data-rebar-active` on the selected one.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'A close, low-risk rename — AntD\'s `Segmented` takes the same `options`/`value` shape.' },
    ],
  },
];

export default function SegmentedControlPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>SegmentedControl</Heading>
      <Text color="secondary">
        A pill-style single-select button group — a real ARIA radio group underneath, visually
        distinct from <code>RadioGroup</code> for the same single-choice interaction.
      </Text>

      <LivePreview>
        <SegmentedControl options={OPTIONS} defaultValue="week" aria-label="Range" />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
