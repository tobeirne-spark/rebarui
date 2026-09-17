import clsx from "clsx";
import { Table } from "./Table";
import type { TableColumn } from "./Table";
import type { BionicOptions } from "../bionic";

export type PivotAggregate = "sum" | "count" | "average";

export interface PivotTableProps {
  /** Raw, un-aggregated rows — a plain array of flat records, never a function-valued accessor,
   * so this stays safe to build from a Server Component (same convention `stats-table` uses in
   * `@rebar-ui/placement`'s `BlockRenderer`). */
  data: Record<string, string | number>[];
  /** Which field's distinct values become row headers (first-seen order). */
  rowField: string;
  /** Which field's distinct values become column headers (first-seen order). */
  colField: string;
  /** Which numeric field gets aggregated into each row×col cell. */
  valueField: string;
  /** Defaults to `"sum"`. */
  aggregate?: PivotAggregate;
  /** A real, visible caption — see ref/HEURISTICS.md #16. */
  title?: string;
  className?: string;
  "aria-label"?: string;
  /** Force bionic reading on/off for the title/column headers, overriding the ambient
   * data-rebar-bionic setting — forwarded to the underlying `Table`. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

interface PivotRow {
  __rowKey: string;
  [columnKey: string]: string | number;
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function distinctInOrder(data: Record<string, string | number>[], field: string): (string | number)[] {
  const seen = new Set<string | number>();
  const out: (string | number)[] = [];
  for (const row of data) {
    const value = row[field];
    if (value === undefined || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function aggregateValues(values: number[], aggregate: PivotAggregate): number {
  if (aggregate === "count") return values.length;
  const total = values.reduce((sum, v) => sum + v, 0);
  if (aggregate === "average") return values.length === 0 ? 0 : total / values.length;
  return total;
}

/**
 * A cross-tab aggregation grid: distinct `rowField`/`colField` values become row/column headers,
 * `valueField` is aggregated (`sum`/`count`/`average`) into each cell, with a real "Total" row and
 * "Total" column. Renders through the real `Table` component — no bespoke grid markup — using
 * plain named row properties (no `accessor`/`render` function props), matching `stats-table`'s
 * own convention so a caller can build this from a Server Component.
 */
export function PivotTable({
  data,
  rowField,
  colField,
  valueField,
  aggregate = "sum",
  title,
  className,
  "aria-label": ariaLabel,
  bionic,
  bionicOptions,
}: PivotTableProps) {
  const rowValues = distinctInOrder(data, rowField);
  const colValues = distinctInOrder(data, colField);

  const valuesFor = (rowValue: string | number | undefined, colValue: string | number | undefined): number[] =>
    data
      .filter(
        (r) =>
          (rowValue === undefined || r[rowField] === rowValue) &&
          (colValue === undefined || r[colField] === colValue),
      )
      .map((r) => toNumber(r[valueField]));

  const columns: TableColumn<PivotRow>[] = [
    { key: "__label", header: rowField },
    ...colValues.map((cv, i) => ({ key: `col-${i}`, header: String(cv), align: "right" as const })),
    { key: "__total", header: "Total", align: "right" as const },
  ];

  const bodyRows: PivotRow[] = rowValues.map((rv, ri) => {
    const row: PivotRow = { __rowKey: `row-${ri}`, __label: String(rv) };
    colValues.forEach((cv, ci) => {
      row[`col-${ci}`] = aggregateValues(valuesFor(rv, cv), aggregate);
    });
    row.__total = aggregateValues(valuesFor(rv, undefined), aggregate);
    return row;
  });

  const totalsRow: PivotRow = { __rowKey: "row-total", __label: "Total" };
  colValues.forEach((cv, ci) => {
    totalsRow[`col-${ci}`] = aggregateValues(valuesFor(undefined, cv), aggregate);
  });
  totalsRow.__total = aggregateValues(valuesFor(undefined, undefined), aggregate);

  const tableData = [...bodyRows, totalsRow];

  return (
    <div className={clsx("rebar-pivot-table", className)} data-rebar-component="pivot-table">
      <Table
        columns={columns}
        data={tableData}
        rowKey="__rowKey"
        caption={title}
        aria-label={ariaLabel}
        bionic={bionic}
        bionicOptions={bionicOptions}
      />
    </div>
  );
}
