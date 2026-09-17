"use client";

import { useState } from "react";
import { Heading, Stack, Text, TimePicker } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `const [time, setTime] = useState("09:00");\n\n<TimePicker value={time} onValueChange={setTime} minuteStep={15} />`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["TimePicker"] ?? [] },
  {
    type: "doc-section",
    heading: "Wire format vs. display format",
    body: [
      {
        kind: "text",
        text: '`value` is always 24-hour `"HH:MM"` (e.g. `"14:30"`) regardless of `format` — `format` only changes how the trigger label and the hour list are displayed. Picking an hour or minute applies immediately, matching `Select`\'s own no-separate-confirm-step behavior — but unlike `Select`, the popover deliberately stays open across an hour *and* a minute pick (closing after the first would force reopening it to set the other half).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="time-picker"` on the trigger; `data-rebar-part="panel"|"hours"|"minutes"|"hour"|"minute"|"period-toggle"|"period-am"|"period-pm"`, with `data-rebar-selected` on the currently-picked hour/minute/period.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `TimePicker` is a close direct equivalent — `minuteStep` maps to AntD's `minuteStep`. One real difference to flag: AntD's `TimePicker` uses a `dayjs` value, while this component uses a plain `\"HH:MM\"` string — a migration needs to convert at the boundary (`dayjs(value, \"HH:mm\")` in, `.format(\"HH:mm\")` out), not a silent drop-in.",
      },
    ],
  },
];

export default function TimePickerPage() {
  const [time, setTime] = useState("09:00");

  return (
    <Stack gap="lg">
      <Heading level={1}>TimePicker</Heading>
      <Text color="secondary">
        A trigger button opening a popover of scrollable hour/minute columns — real buttons, not
        a native <code>&lt;select&gt;</code>.
      </Text>

      <Stack gap="sm" align="start">
        <TimePicker value={time} onValueChange={setTime} minuteStep={15} />
        <Text size="sm" color="secondary">
          Selected: {time}
        </Text>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
