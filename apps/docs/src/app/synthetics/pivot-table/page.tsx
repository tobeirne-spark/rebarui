import { Heading, PivotTable, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SALES = [
  { region: "West", quarter: "Q1", amount: 42000 },
  { region: "West", quarter: "Q2", amount: 51000 },
  { region: "East", quarter: "Q1", amount: 38000 },
  { region: "East", quarter: "Q2", amount: 44000 },
  { region: "West", quarter: "Q1", amount: 12000 },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<PivotTable title="Sales by region and quarter" data={sales} rowField="region" colField="quarter" valueField="amount" aggregate="sum" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PivotTable"] ?? [] },
  {
    type: "doc-section",
    heading: "How this differs from DataGrid",
    body: [
      {
        kind: "text",
        text: 'PivotTable and [DataGrid](/opinions/data-grid) both render through the real `Table`, but they answer different questions and aren\'t interchangeable. PivotTable always aggregates: every rendered cell is a `sum`/`count`/`average` collapsing every source row that matches its row/column value — there\'s no prop to turn that off, and no rendered cell ever corresponds to a single source row. DataGrid never aggregates, even with its own `groupBy` set — grouping only reorganizes rows into collapsible sections; every original row still renders as its own row underneath its group header, count included but untouched.',
      },
      {
        kind: "text",
        text: 'Concrete example: three raw sales rows for West / Q1 — amounts `42000`, `12000`, `9000` — collapse into a single PivotTable cell reading `63000` (or `3` for `aggregate="count"`) at the West row, Q1 column. The same three rows through `DataGrid` with `groupBy="quarter"` still render as three separate rows, nested under one collapsible "Q1 (3)" group header — nothing is summed, only regrouped. Reach for PivotTable when the question is a total/count/average across a dimension; reach for DataGrid\'s `groupBy` when the question is just organizing rows into folders without losing any of them.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Real row/column totals",
    body: [
      {
        kind: "text",
        text: '`data` stays a plain array of flat records (never a function-valued accessor), matching the same convention `@rebar-ui/placement`\'s `stats-table` block already uses, so this stays safe to build from a Server Component. Distinct row/column values are taken in first-seen order, not sorted. Both a "Total" row and a "Total" column are computed by re-aggregating over the matching subset — not just summing the per-cell aggregates — so `average`/`count` totals stay semantically correct, not just summed averages.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="pivot-table"` on the root; renders through the real `Table` component underneath.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD ships no dedicated pivot-table component of its own — a migration typically composes AntD's `Table` with the aggregation done ahead of time (the same shape this component already produces) or reaches for a dedicated library (e.g. `react-pivottable`) for drill-down.",
      },
    ],
  },
];

export default function PivotTablePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>PivotTable</Heading>
      <Text color="secondary">
        A cross-tab aggregation grid — real row/column totals, built on the real{" "}
        <code>Table</code>.
      </Text>

      <PivotTable
        title="Sales by region and quarter"
        data={SALES}
        rowField="region"
        colField="quarter"
        valueField="amount"
        aggregate="sum"
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
