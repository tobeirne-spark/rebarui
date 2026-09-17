import { Heading, Progress, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Progress value={72} aria-label="Upload progress" />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Progress"] ?? [] },
  {
    type: "doc-section",
    heading: "A real Radix linear progress bar",
    body: [
      {
        kind: "text",
        text: '`value`/`max` (defaults to 100) — a plain horizontal bar. Distinct from `ProgressCircle` (the same underlying percentage, drawn as a ring instead of a bar) — reach for whichever shape fits the surrounding layout.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="progress"` on the root; `data-rebar-part="indicator"` on the fill.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'AntD\'s `Progress` (with `type="line"`, its default) takes the same `percent` value — a close, low-risk rename.' },
    ],
  },
];

export default function ProgressPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Progress</Heading>
      <Text color="secondary">A real Radix linear progress bar.</Text>

      <LivePreview>
        <Stack gap="md" style={{ maxWidth: 320 }}>
          <Progress value={25} aria-label="25%" />
          <Progress value={72} aria-label="72%" />
          <Progress value={100} aria-label="Complete" />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
