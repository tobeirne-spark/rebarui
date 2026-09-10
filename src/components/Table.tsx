import type { ReactNode } from "react";
import { useState } from "react";
import clsx from "clsx";
import { Checkbox } from "./Checkbox";
import { Empty } from "./Empty";
import { Pagination } from "./Pagination";
import { Skeleton } from "./Skeleton";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface TableColumn<T> {
  key: string;
  header: string;
  /** Reads the raw value from a row — defaults to `(row as any)[key]`. Only needed when a
   * column's value isn't a direct property (a computed/derived value), or when `key` doesn't
   * match a real property name (e.g. a synthetic "actions" column). */
  accessor?: (row: T) => unknown;
  /** Custom cell content — defaults to the accessed value rendered as plain text. */
  render?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string | number;
}

export interface TableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  /** A stable, unique string per row — required, same as React's own `key` requirement, and
   * needed again separately for row-selection tracking. A plain property name (e.g. `"id"`) is
   * usually enough and, unlike a function, stays plain serializable data — pass a function only
   * when a row's real identity isn't a direct property (composed from more than one field). */
  rowKey: string | ((row: T) => string);
  /** Current sort — omit to manage sorting internally (uncontrolled). Passing this makes sorting
   * controlled, same convention as every other stateful rebar-ui component. */
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort | null) => void;
  /** Omit entirely to disable row selection (no checkbox column rendered at all) — this isn't a
   * `boolean` toggle because the selected keys have to live somewhere, and controlled is the only
   * sensible default for a value a consumer almost always needs to read back out. */
  selectedRowKeys?: string[];
  onSelectedRowKeysChange?: (keys: string[]) => void;
  /** Omit to show every row unpaginated. */
  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  /** Shown in place of the body when `data` is empty and `loading` is false. */
  emptyMessage?: ReactNode;
  /** Bounds the table's own scrollable body — see ref/HEURISTICS.md #45 (a control's footprint
   * stays bounded, however much data it holds) and #43 (a scrollable region fades into a mist,
   * not a hard crop — the sticky header here plays the equivalent role: a signal that content
   * continues above, not a silent cutoff). Omit for a table that just grows with its data. */
  maxHeight?: number;
  /** A real, visible caption — see ref/HEURISTICS.md #16 (charts and data displays ship with
   * context, not just an accessible name). */
  caption?: ReactNode;
  "aria-label"?: string;
  className?: string;
  /** Force bionic reading on/off for the caption and column headers, overriding the ambient
   * data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

function defaultAccessor<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * A real, read-only data table — sortable columns (click a sortable header, cycles
 * asc → desc → unsorted), a sticky header over a bounded, independently-scrollable body, optional
 * row selection (a header checkbox selects/deselects every row on the current page, with a real
 * indeterminate state when only some are selected), optional pagination (via the real
 * `Pagination` component), and real loading (`Skeleton` rows) / empty (`Empty`) states — never
 * just a silent blank table. Deliberately shares its column/row-data shape with what a future
 * editable variant would need (an `accessor`/`render` pair per column, not a fixed cell-type
 * enum), so adding in-place editing later is a real extension of this component, not a rewrite.
 */
export function Table<T>({
  columns,
  data,
  rowKey,
  sort: controlledSort,
  onSortChange,
  selectedRowKeys,
  onSelectedRowKeysChange,
  pageSize,
  page: controlledPage,
  onPageChange,
  loading = false,
  emptyMessage = "No data.",
  maxHeight,
  caption,
  bionic,
  bionicOptions,
  className,
  ...props
}: TableProps<T>) {
  const captionContent = useBionicChildren(caption, bionic, bionicOptions);
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const getRowKey = (row: T): string =>
    typeof rowKey === "string" ? String(defaultAccessor(row, rowKey)) : rowKey(row);

  const [internalSort, setInternalSort] = useState<TableSort | null>(null);
  const isSortControlled = controlledSort !== undefined;
  const sort = isSortControlled ? controlledSort : internalSort;

  const [internalPage, setInternalPage] = useState(1);
  const isPageControlled = controlledPage !== undefined;
  const page = isPageControlled ? controlledPage : internalPage;

  const isSelectable = selectedRowKeys !== undefined;

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return;
    const next: TableSort | null =
      sort?.key === col.key
        ? sort.direction === "asc"
          ? { key: col.key, direction: "desc" }
          : null
        : { key: col.key, direction: "asc" };
    if (!isSortControlled) setInternalSort(next);
    onSortChange?.(next);
  };

  const handlePageChange = (next: number) => {
    if (!isPageControlled) setInternalPage(next);
    onPageChange?.(next);
  };

  const sortColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;
  const sorted =
    sort && sortColumn
      ? [...data].sort((a, b) => {
          const accessor = sortColumn.accessor ?? ((row: T) => defaultAccessor(row, sortColumn.key));
          const cmp = compareValues(accessor(a), accessor(b));
          return sort.direction === "asc" ? cmp : -cmp;
        })
      : data;

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const pageRows = pageSize ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const pageRowKeys = pageRows.map(getRowKey);
  const selectedOnPage = isSelectable ? pageRowKeys.filter((k) => selectedRowKeys!.includes(k)) : [];
  const allOnPageSelected = isSelectable && pageRowKeys.length > 0 && selectedOnPage.length === pageRowKeys.length;
  const someOnPageSelected = isSelectable && selectedOnPage.length > 0 && !allOnPageSelected;

  const toggleAllOnPage = () => {
    if (!isSelectable) return;
    const withoutPage = selectedRowKeys!.filter((k) => !pageRowKeys.includes(k));
    onSelectedRowKeysChange?.(allOnPageSelected ? withoutPage : [...withoutPage, ...pageRowKeys]);
  };

  const toggleRow = (key: string) => {
    if (!isSelectable) return;
    onSelectedRowKeysChange?.(
      selectedRowKeys!.includes(key) ? selectedRowKeys!.filter((k) => k !== key) : [...selectedRowKeys!, key],
    );
  };

  return (
    <div className={clsx("rebar-table-wrapper", className)} data-rebar-component="table" {...props}>
      {caption ? (
        <div className="rebar-table-caption" data-rebar-part="caption">
          {captionContent}
        </div>
      ) : null}
      <div className="rebar-table-scroll" data-rebar-part="scroll" style={{ maxHeight }}>
        <table className="rebar-table" aria-label={props["aria-label"]}>
          <thead className="rebar-table-head">
            <tr>
              {isSelectable ? (
                <th className="rebar-table-select-cell">
                  <Checkbox
                    checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAllOnPage}
                    aria-label="Select all rows on this page"
                  />
                </th>
              ) : null}
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={clsx("rebar-table-th", col.sortable && "rebar-table-th-sortable")}
                    style={{ textAlign: col.align ?? "left", width: col.width }}
                    aria-sort={isSorted ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className="rebar-table-sort-button"
                        onClick={() => handleSort(col)}
                      >
                        <span>{renderBionicChildren(col.header, bionicEnabled, bionicOptions)}</span>
                        <span className="rebar-table-sort-icon" aria-hidden="true">
                          {isSorted ? (sort!.direction === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      renderBionicChildren(col.header, bionicEnabled, bionicOptions)
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="rebar-table-body">
            {loading
              ? Array.from({ length: pageSize ?? 5 }, (_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {isSelectable ? <td className="rebar-table-select-cell" /> : null}
                    {columns.map((col) => (
                      <td key={col.key} className="rebar-table-td">
                        <Skeleton variant="text" lines={1} />
                      </td>
                    ))}
                  </tr>
                ))
              : pageRows.map((row, rowIndex) => {
                  const key = getRowKey(row);
                  return (
                    <tr
                      key={key}
                      className="rebar-table-row"
                      data-rebar-part="row"
                      aria-selected={isSelectable ? selectedRowKeys!.includes(key) : undefined}
                    >
                      {isSelectable ? (
                        <td className="rebar-table-select-cell">
                          <Checkbox
                            checked={selectedRowKeys!.includes(key)}
                            onCheckedChange={() => toggleRow(key)}
                            aria-label="Select row"
                          />
                        </td>
                      ) : null}
                      {columns.map((col) => {
                        const accessor = col.accessor ?? ((r: T) => defaultAccessor(r, col.key));
                        const value = accessor(row);
                        return (
                          <td key={col.key} className="rebar-table-td" style={{ textAlign: col.align ?? "left" }}>
                            {col.render ? col.render(value, row, rowIndex) : String(value ?? "")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {!loading && data.length === 0 ? <Empty description={emptyMessage} /> : null}
      {pageSize && data.length > 0 ? (
        <div className="rebar-table-pagination">
          <Pagination current={page} total={totalPages} onChange={handlePageChange} aria-label="Table pages" />
        </div>
      ) : null}
    </div>
  );
}
