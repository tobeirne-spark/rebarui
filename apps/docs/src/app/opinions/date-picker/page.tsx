"use client";

import { useState } from "react";
import { DatePicker, Heading, Stack, Text } from "rebar-ui";
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
        code: `const [date, setDate] = useState<Date>(new Date());\n\n<DatePicker value={date} onValueChange={setDate} />`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["DatePicker"] ?? [] },
  {
    type: "doc-section",
    heading: "A redesign, not a popover trigger",
    body: [
      {
        kind: "text",
        text: 'This component previously opened a `Popover` containing a full `Calendar` grid — which just duplicated `Calendar` itself with an extra click in front of it. The actually distinct, useful shape is a compact day/month/year numeric triplet (three bounded `NumberInput`s: 1-31 depending on the selected month, 1-12, and a year within a real human lifetime range by default) — closer in spirit to `NumberInput` than to a second `Calendar`. It\'s the fast, keyboard-first shape for someone who already knows the date they want (a birthdate, a known deadline) and would rather type three numbers than click through a grid. Reach for `Calendar` directly (in a `Popover` for a trigger-button shape) when browsing/visual picking is actually the point.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Bounded numeric entry",
    body: [
      {
        kind: "text",
        text: 'Each field clamps to what\'s actually valid (heuristic #26: input constraints are visible, not silently enforced) — the day field\'s own max recalculates against the selected month/year (so a day past the 28th clamps down the moment the month changes to February), and month is bounded to 1-12. `minDate`/`maxDate` bound the committed result the same way as before. One deliberate exception: the year field does *not* clamp a partial, sub-1000 typed value (e.g. the "1" on the way to typing "1998") straight to its bound — doing that immediately overwrites the field back to the bound after the very first digit, making it impossible to type a multi-digit year at all. Real bounds apply once the year is a plausible 4-digit number.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="date-picker"` on the root; parts `day`, `month`, `year` (each a real `NumberInput`, carrying its own `data-rebar-component="number-input"`).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not a direct structural match anymore — AntD's own `DatePicker` is a calendar-popover shape (like this component's own previous design). A migration reimplements this as either AntD's `DatePicker` (if calendar-browsing is what's actually wanted) or three plain AntD `InputNumber`s (to keep the same compact direct-entry shape).",
      },
    ],
  },
];

export default function DatePickerPage() {
  const [date, setDate] = useState<Date>(new Date(2026, 5, 15));

  return (
    <Stack gap="lg">
      <Heading level={1}>DatePicker</Heading>
      <Text color="secondary">
        A compact day/month/year numeric triplet — bounded direct entry, not a calendar popover.
      </Text>

      <Stack gap="sm">
        <DatePicker value={date} onValueChange={setDate} />
        <Text size="sm" color="secondary">
          Selected: {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </Text>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
