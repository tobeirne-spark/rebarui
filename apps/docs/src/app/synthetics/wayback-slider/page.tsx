"use client";

import { useState } from "react";
import { Heading, Stack, Text, WaybackSlider } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const DATES = [
  new Date(2026, 6, 1),
  new Date(2026, 7, 1),
  new Date(2026, 8, 1),
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<WaybackSlider dates={[new Date(2026, 6, 1), new Date(2026, 7, 1), new Date(2026, 8, 1)]} value={reportDate} onValueChange={setReportDate} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["WaybackSlider"] ?? [] },
  {
    type: "doc-section",
    heading: "The one shared mechanism, not two separate implementations",
    body: [
      {
        kind: "text",
        text: 'This component has no idea what a "snapshot" actually contains — only a list of dates. `GanttChart` and `PertChart` both pair with it the identical way: keep one full historical copy of your own data per reporting date, and feed whichever one this slider currently reports into the real chart. Built entirely on the real `Slider` (a discrete 0..dates.length-1 index underneath), not a reimplemented drag mechanism.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="wayback-slider"` on the root; parts: `current-date`, `latest-badge`, `ticks`. The slider itself carries `Slider`\'s own `data-rebar-component="slider"` underneath.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's own `Slider` has a `marks` prop for labeled steps, the closest structural equivalent, but no direct \"scrub through historical snapshots\" pattern of its own.",
      },
    ],
  },
];

export default function WaybackSliderPage() {
  const [reportDate, setReportDate] = useState<Date>(DATES[DATES.length - 1]!);

  return (
    <Stack gap="lg">
      <Heading level={1}>WaybackSlider</Heading>
      <Text color="secondary">
        A scrubber over a list of historical snapshot dates — the shared mechanism{" "}
        <code>GanttChart</code> and <code>PertChart</code> both pair with, for scrubbing through
        real past reports directly instead of maintaining separate baseline objects.
      </Text>

      <LivePreview>
        <WaybackSlider dates={DATES} value={reportDate} onValueChange={setReportDate} />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
