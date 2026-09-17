"use client";

import { Heading, ProgressCircle, Stack, Text } from "rebar-ui";
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
        code: '<ProgressCircle percent={72}>72%</ProgressCircle>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ProgressCircle"] ?? [] },
  {
    type: "doc-section",
    heading: "Lighter-weight than GaugeChart",
    body: [
      {
        kind: "text",
        text: "`GaugeChart` carries axis labels, ticks, and threshold bands for a real dashboard metric. `ProgressCircle` is the antd-mobile pattern for a bare \"how far along is this\" ring — an upload, a multi-step form's completion — with none of that configuration. Reach for `GaugeChart` when the extra context matters; reach for this when it would just be visual noise.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="progress-circle"` on the root; parts: `track`, `fill`, `label`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: 'Not codemod-covered — the antd-mobile pattern. AntD desktop\'s `Progress` component with `type="circle"` is the direct equivalent.',
      },
    ],
  },
];

export default function ProgressCirclePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ProgressCircle</Heading>
      <Text color="secondary">
        A plain circular progress ring — a lighter-weight alternative to <code>GaugeChart</code>{" "}
        for a single, bare percentage.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="lg" style={{ alignItems: "center" }}>
          <ProgressCircle percent={25}>25%</ProgressCircle>
          <ProgressCircle percent={72}>72%</ProgressCircle>
          <ProgressCircle percent={100} color="var(--rebar-color-success)">
            Done
          </ProgressCircle>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
