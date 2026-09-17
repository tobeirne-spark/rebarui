import { Box, CalendarHeatmap, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

function seededActivity() {
  const data: { date: string; value: number }[] = [];
  let seed = 7;
  for (let d = 0; d < 200; d++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const value = seed % 5 === 0 ? 0 : (seed % 10) + 1;
    const date = new Date(Date.UTC(2026, 0, 1) + d * 86_400_000);
    data.push({ date: date.toISOString().slice(0, 10), value });
  }
  return data;
}

const DATA = seededActivity();

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<CalendarHeatmap title="Activity" data={[{ date: "2026-01-01", value: 3 }, { date: "2026-01-02", value: 8 }, /* ... */]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["CalendarHeatmap"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: 'One small square per day, arranged in real week columns and day-of-week rows, shaded by that day\'s `value` — the GitHub-contributions-graph pattern. A genuinely different shape from `Heatmap` (an arbitrary row/col matrix with no date semantics at all): this one lays out real calendar weeks, labels months along the top, and treats a missing date as a distinctly empty cell rather than a real 0 — the same sparse-data convention `Heatmap` already uses, just over a real date axis instead of arbitrary category pairs.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="calendar-heatmap"` on the root `<figure>`; `data-rebar-part="cell"` on a real day, `"cell-missing"` on a day absent from `data`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart components of its own; a migration typically maps directly to whatever charting library's own calendar-heatmap chart the target project uses.",
      },
    ],
  },
];

export default function CalendarHeatmapPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>CalendarHeatmap</Heading>
      <Text color="secondary">
        A GitHub-contributions-style calendar — one small square per day, shaded by that day&apos;s
        value.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-lg)" }}>
        <CalendarHeatmap title="Activity" data={DATA} />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
