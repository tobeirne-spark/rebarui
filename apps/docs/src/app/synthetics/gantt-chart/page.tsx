"use client";

import { useState } from "react";
import { GanttChart, Heading, Stack, Text, WaybackSlider } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const TASKS = [
  { id: "design", label: "Design", start: new Date(2026, 8, 1), end: new Date(2026, 8, 7), progress: 1 },
  { id: "build", label: "Build", start: new Date(2026, 8, 7), end: new Date(2026, 8, 18), progress: 0.6, dependsOn: ["design"] },
  { id: "test", label: "Test", start: new Date(2026, 8, 16), end: new Date(2026, 8, 23), progress: 0.1, dependsOn: ["build"] },
  { id: "launch", label: "Launch", start: new Date(2026, 8, 23), end: new Date(2026, 8, 25), dependsOn: ["test"] },
];

// Three real historical snapshots of the same report, one per reporting date — the "scrub through
// past reports directly" shape `WaybackSlider` is built for, instead of maintaining a separate
// baseline object per task. Each snapshot is a complete, independent task list (progress values
// genuinely differ), not a diff against the current one.
const REPORT_DATES = [new Date(2026, 8, 5), new Date(2026, 8, 12), new Date(2026, 8, 19)];
const SNAPSHOTS: Record<number, typeof TASKS> = {
  [REPORT_DATES[0]!.getTime()]: [
    { id: "design", label: "Design", start: new Date(2026, 8, 1), end: new Date(2026, 8, 7), progress: 0.7 },
    { id: "build", label: "Build", start: new Date(2026, 8, 7), end: new Date(2026, 8, 18), progress: 0, dependsOn: ["design"] },
    { id: "test", label: "Test", start: new Date(2026, 8, 16), end: new Date(2026, 8, 23), progress: 0, dependsOn: ["build"] },
    { id: "launch", label: "Launch", start: new Date(2026, 8, 23), end: new Date(2026, 8, 25), dependsOn: ["test"] },
  ],
  [REPORT_DATES[1]!.getTime()]: [
    { id: "design", label: "Design", start: new Date(2026, 8, 1), end: new Date(2026, 8, 7), progress: 1 },
    { id: "build", label: "Build", start: new Date(2026, 8, 7), end: new Date(2026, 8, 18), progress: 0.25, dependsOn: ["design"] },
    { id: "test", label: "Test", start: new Date(2026, 8, 16), end: new Date(2026, 8, 23), progress: 0, dependsOn: ["build"] },
    { id: "launch", label: "Launch", start: new Date(2026, 8, 23), end: new Date(2026, 8, 25), dependsOn: ["test"] },
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
        code: '<GanttChart title="Launch plan" tasks={[{ id: "design", label: "Design", start: new Date(2026, 8, 1), end: new Date(2026, 8, 7), progress: 1 }, /* ... */]} currentDate={new Date()} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["GanttChart"] ?? [] },
  {
    type: "doc-section",
    heading: "Dependencies as simple elbow connectors",
    body: [
      {
        kind: "text",
        text: "A task's `dependsOn` draws a simple right-angle elbow line (with an arrowhead) from the depended-on task's bar end to this task's bar start — not a curved connector. A dangling id (referencing a task that's been renamed or removed) is silently skipped rather than throwing, since a caller mid-edit of a task list shouldn't have this component crash on a stale reference. The x-axis reuses the same tick-generation approach `LineChart`/`ScatterChart` already use, adapted for dates.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "currentDate — a real \"where are we now\" hash-mark",
    body: [
      {
        kind: "text",
        text: "`currentDate` draws a distinct dashed vertical marker at that date, when it falls within the chart's own domain — a real visible reference against the task bars, not something a viewer has to infer from the axis ticks alone. Omitted entirely outside the domain or when not supplied.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Wayback slider — scrub through real past reports",
    body: [
      {
        kind: "text",
        text: "`GanttChart` has no baseline-tracking of its own — no separate object to diff `tasks` against. Instead, pair it with the shared `WaybackSlider` component: the caller keeps one full historical snapshot of `tasks` per reporting date, and feeds whichever snapshot the slider currently reports straight into `tasks`. `WaybackSlider` itself has no idea what a snapshot contains — the exact same mechanism pairs with `PertChart` too.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="gantt-chart"` on the root `<figure>`; `data-rebar-part="current-date-marker"` for the `currentDate` hash-mark.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a Gantt chart typically migrates to a dedicated library (e.g. `dhtmlx-gantt`, `frappe-gantt`) rather than an antd component.",
      },
    ],
  },
];

export default function GanttChartPage() {
  const [reportDate, setReportDate] = useState<Date>(REPORT_DATES[REPORT_DATES.length - 1]!);
  const snapshot = SNAPSHOTS[reportDate.getTime()] ?? TASKS;

  return (
    <Stack gap="lg">
      <Heading level={1}>GanttChart</Heading>
      <Text color="secondary">
        A project timeline — tasks positioned on a shared date axis, with dependency connectors.
      </Text>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          currentDate — a dashed &quot;Today&quot; marker
        </Text>
        <GanttChart title="Launch plan" tasks={TASKS} currentDate={new Date(2026, 8, 15)} />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Paired with WaybackSlider — scrub to any of the three real historical reports below
        </Text>
        <WaybackSlider dates={REPORT_DATES} value={reportDate} onValueChange={setReportDate} />
        <GanttChart title="Launch plan (as reported)" tasks={snapshot} currentDate={reportDate} />
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
