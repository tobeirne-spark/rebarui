"use client";

import { useState } from "react";
import { DataGrid, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

interface Row {
  id: string;
  team: string;
  lead: string;
  status: string;
}

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<DataGrid\n  columns={[{ key: "team", header: "Team" }, { key: "lead", header: "Lead" }]}\n  data={rows}\n  rowKey="id"\n  editable\n  onCellChange={(rowKey, columnKey, newValue) => { /* ... */ }}\n  groupBy="status"\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["DataGrid"] ?? [] },
  {
    type: "doc-section",
    heading: "Built on the real Table, not reimplemented",
    body: [
      {
        kind: "text",
        text: "`DataGrid` extends `Table`'s own props directly — same `columns`/`data`/`rowKey`/sorting/selection/pagination. `editable` reuses the real `Editable` component per cell rather than a hand-rolled input; `groupBy` groups rows client-side (first-seen order) into real, collapsible group-header rows, each holding its own nested `Table`.",
      },
      {
        kind: "text",
        text: '`groupBy` only reorganizes rows into sections — it never aggregates, and every original row still renders on its own underneath its group header. For a grid where each cell is instead a real `sum`/`count`/`average` collapsing many rows into one, see [PivotTable](/synthetics/pivot-table).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="data-grid"` on the root; every `Table`/`Editable`/`Accordion` attribute underneath is the real thing, not duplicated.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Table` supports inline editing via a custom `render` per column and row-grouping via a nested `dataSource` — a migration folds this component's `editable`/`groupBy` behavior into that pattern rather than a 1:1 prop mapping.",
      },
    ],
  },
];

export default function DataGridPage() {
  const [rows, setRows] = useState<Row[]>([
    { id: "1", team: "Engineering", lead: "Priya Shah", status: "Active" },
    { id: "2", team: "Design", lead: "Marcus Webb", status: "Active" },
    { id: "3", team: "Platform", lead: "Jordan Lee", status: "Archived" },
  ]);

  return (
    <Stack gap="lg">
      <Heading level={1}>DataGrid</Heading>
      <Text color="secondary">
        A heavier-weight table with inline editing and row grouping — built on the real{" "}
        <code>Table</code>.
      </Text>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          <code>editable</code> + <code>groupBy</code> together — every cell click-to-edit, rows
          collapsed into their own status section.
        </Text>
        <DataGrid
          columns={[
            { key: "team", header: "Team" },
            { key: "lead", header: "Lead" },
            { key: "status", header: "Status" },
          ]}
          data={rows}
          rowKey="id"
          editable
          groupBy="status"
          onCellChange={(rowKey, columnKey, newValue) => {
            setRows((prev) =>
              prev.map((row) => (row.id === rowKey ? { ...row, [columnKey]: newValue } : row)),
            );
          }}
        />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          <code>groupBy</code> alone — plain, read-only rows, still grouped.
        </Text>
        <DataGrid
          columns={[
            { key: "team", header: "Team" },
            { key: "lead", header: "Lead" },
            { key: "status", header: "Status" },
          ]}
          data={rows}
          rowKey="id"
          groupBy="status"
        />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          A flat grid with neither <code>editable</code> nor <code>groupBy</code> set — every
          other <code>Table</code> prop (sorting, selection, pagination) still applies unchanged,
          since <code>DataGrid</code> extends <code>Table</code>&apos;s own props directly rather
          than replacing them.
        </Text>
        <DataGrid
          columns={[
            { key: "team", header: "Team" },
            { key: "lead", header: "Lead" },
            { key: "status", header: "Status" },
          ]}
          data={rows}
          rowKey="id"
        />
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
