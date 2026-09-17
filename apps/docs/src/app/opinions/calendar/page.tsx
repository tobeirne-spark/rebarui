"use client";

import { useState } from "react";
import { Calendar, Heading, Stack, Text } from "rebar-ui";
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
        code: `const [date, setDate] = useState<Date>();\n\n<Calendar value={date} onValueChange={setDate} minDate={new Date()} />`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Calendar"] ?? [] },
  {
    type: "doc-section",
    heading: "Two independent controlled/uncontrolled pairs",
    body: [
      {
        kind: "text",
        text: "`value`/`onValueChange` is the picked date. `month`/`onMonthChange` is which month is currently displayed — entirely independent of `value`, since navigating to a different month never implies picking a date in it.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="calendar"`; each day cell carries `data-rebar-part="day"` plus `data-rebar-selected`, `data-rebar-today`, and `data-rebar-outside` (a leading/trailing day from an adjacent month) as boolean attributes.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Calendar` is a close direct equivalent — `value`/`onSelect` map to this component's `value`/`onValueChange`. One real difference to flag, not gloss over: AntD's `Calendar` takes a `dayjs` value, while this component uses a plain native `Date` — a migration needs to wrap the value in `dayjs(value)` at the boundary.",
      },
    ],
  },
];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <Stack gap="lg">
      <Heading level={1}>Calendar</Heading>
      <Text color="secondary">
        A standalone month-grid display for picking a date — not popover-wrapped itself, so any
        caller can layer a real <code>Popover</code> around it for a trigger-button shape. For a
        fast, keyboard-first direct-entry alternative (typing a known date instead of browsing a
        grid), see <code>DatePicker</code>.
      </Text>

      <Stack gap="sm" style={{ maxWidth: 380 }}>
        <Calendar value={date} onValueChange={setDate} minDate={new Date()} />
        <Text size="sm" color="secondary">
          Selected: {date ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "none"}
        </Text>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
