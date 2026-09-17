"use client";

import { useState } from "react";
import { Box, Heading, PertChart, Stack, Text, WaybackSlider } from "rebar-ui";
import type { PertTask } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// A textbook two-path example: Requirements -> Design -> Launch (3+4+2=9, the longer/critical
// path) vs. Requirements -> Prototype -> Launch (3+2+2=7, 2 days of real slack).
const TASKS: PertTask[] = [
  { id: "req", label: "Requirements", duration: 3 },
  { id: "design", label: "Design", duration: 4, dependsOn: ["req"] },
  { id: "proto", label: "Prototype", duration: 2, dependsOn: ["req"] },
  { id: "launch", label: "Launch", duration: 2, dependsOn: ["design", "proto"] },
];

const REPORT_DATES = [new Date(2026, 8, 1), new Date(2026, 8, 8), new Date(2026, 8, 15)];
const SNAPSHOTS: Record<number, PertTask[]> = {
  // Design was originally estimated much shorter than Prototype's own path — Prototype (3+2+2=7)
  // was the critical path at this first report, not Design (3+1+2=6).
  [REPORT_DATES[0]!.getTime()]: [
    { id: "req", label: "Requirements", duration: 3 },
    { id: "design", label: "Design", duration: 1, dependsOn: ["req"] },
    { id: "proto", label: "Prototype", duration: 2, dependsOn: ["req"] },
    { id: "launch", label: "Launch", duration: 2, dependsOn: ["design", "proto"] },
  ],
  // Design's estimate grew to 4 days — now tied with Prototype's own path (3+4+2=9 vs 3+2+2=7:
  // Design overtakes it as the real critical path from here on).
  [REPORT_DATES[1]!.getTime()]: [
    { id: "req", label: "Requirements", duration: 3 },
    { id: "design", label: "Design", duration: 4, dependsOn: ["req"] },
    { id: "proto", label: "Prototype", duration: 2, dependsOn: ["req"] },
    { id: "launch", label: "Launch", duration: 2, dependsOn: ["design", "proto"] },
  ],
  [REPORT_DATES[2]!.getTime()]: TASKS,
};

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<PertChart title="Release plan" tasks={[{ id: "req", label: "Requirements", duration: 3 }, { id: "design", label: "Design", duration: 4, dependsOn: ["req"] }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PertChart"] ?? [] },
  {
    type: "doc-section",
    heading: "A real CPM computation, not just a network diagram",
    body: [
      {
        kind: "text",
        text: "Each task's earliest start/finish (a forward pass from the tasks with no dependencies) and latest start/finish (a backward pass from the project's own end) are computed for real from `duration`/`dependsOn` — not caller-supplied. Slack (latestStart − earliestStart) is what actually decides the critical path (drawn in red, both nodes and connecting edges): a task with zero slack has no room to move without delaying the whole project.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "No baseline tracking — pair with WaybackSlider instead",
    body: [
      {
        kind: "text",
        text: 'Explicitly not "most tools make you do baselines and horrible stuff that never works" tooling — no separate baseline object to maintain and diff against. Keep one full historical snapshot of `tasks` per reporting date, and scrub through them directly with the shared `WaybackSlider` component (the exact same one `GanttChart` pairs with) — see the live example below, where the critical path itself visibly shifts as the historical durations change.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="pert-chart"` on the root (built on `NodeLinkGraph`, so its own toolbar/pan/zoom parts render underneath too); `data-rebar-part="critical-node"` on a zero-slack task\'s box, `"node-box"` otherwise.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no diagramming components of its own; a PERT/CPM network diagram typically migrates to a dedicated project-management library rather than an antd component.",
      },
    ],
  },
];

export default function PertChartPage() {
  const [reportDate, setReportDate] = useState<Date>(REPORT_DATES[REPORT_DATES.length - 1]!);
  const snapshot = SNAPSHOTS[reportDate.getTime()] ?? TASKS;

  return (
    <Stack gap="lg">
      <Heading level={1}>PertChart</Heading>
      <Text color="secondary">
        A PERT (Program Evaluation Review Technique) network diagram — tasks as nodes carrying
        their own computed early/late start/finish and slack, with the critical path highlighted.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
        }}
      >
        <PertChart title="Release plan" tasks={TASKS} />
      </Box>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Paired with WaybackSlider — scrub through real historical reports; watch the critical
          path itself shift as reported durations change
        </Text>
        <WaybackSlider dates={REPORT_DATES} value={reportDate} onValueChange={setReportDate} />
        <Box
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
            padding: "var(--rebar-space-lg)",
          }}
        >
          <PertChart title="Release plan (as reported)" tasks={snapshot} />
        </Box>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
