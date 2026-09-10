import { useRef } from "react";
import clsx from "clsx";
import { Table } from "./Table";
import type { TableColumn, TableProps } from "./Table";
import { Editable } from "./Editable";
import { Accordion, AccordionItem } from "./Accordion";
import { renderBionicChildren, useAmbientBionic, useBionicChildren } from "../bionic";

export interface DataGridProps<T> extends TableProps<T> {
  /** When true, every column without its own `render` becomes click-to-edit — reuses the real
   * `Editable` component per cell rather than a hand-rolled input. */
  editable?: boolean;
  /** Fires when an editable cell's value is committed. Note `Editable`'s own commit behavior:
   * it calls `onSubmit` on every keystroke as well as on blur/Enter (there's no separate
   * "draft vs. committed" state inside `Editable` itself) — the value on the final call always
   * reflects the field's settled contents. */
  onCellChange?: (rowKey: string | number, columnKey: string, newValue: string) => void;
  /** A column key whose distinct values become real, collapsible group-header rows (the group's
   * value plus its row count) — grouping is computed client-side over `data`, in first-seen
   * order. Omit for a flat, ungrouped grid. */
  groupBy?: string;
}

function defaultAccessor<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function cellText(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

/**
 * A padded, click-forwarding wrapper around `Editable` so the real clickable footprint reaches
 * the 44×44 touch-target minimum even though `Editable`'s own read-mode button is sized to its
 * text content — see robot.md checklist item 5(a): "padding included if the visual element is
 * smaller". A click landing in that padding (not on the button itself) is forwarded to the real
 * button rather than silently doing nothing.
 */
function EditableCell({
  value,
  label,
  onSubmit,
}: {
  value: unknown;
  label: string;
  onSubmit: (next: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={wrapperRef}
      data-rebar-part="editable-cell"
      style={{ minHeight: 44, minWidth: 44, display: "flex", alignItems: "center" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          wrapperRef.current?.querySelector<HTMLButtonElement>("button")?.click();
        }
      }}
    >
      <Editable defaultValue={cellText(value)} aria-label={label} onSubmit={onSubmit} />
    </div>
  );
}

/**
 * A heavier table built directly on top of the real `Table` — composition, not a
 * reimplementation of table markup. Adds two things `Table` itself deliberately leaves out:
 * inline editing (every cell becomes a real click-to-edit `Editable` when `editable` is set) and
 * row grouping (`groupBy` renders one real, collapsible `Accordion` section — value + row count —
 * per distinct group value, each holding its own nested `Table` of that group's rows).
 * Virtualization is out of scope, matching this project's own low-fidelity philosophy.
 */
export function DataGrid<T>({
  columns,
  data,
  rowKey,
  sort,
  onSortChange,
  selectedRowKeys,
  onSelectedRowKeysChange,
  pageSize,
  page,
  onPageChange,
  loading = false,
  emptyMessage,
  maxHeight,
  caption,
  bionic,
  bionicOptions,
  className,
  "aria-label": ariaLabel,
  editable = false,
  onCellChange,
  groupBy,
  ...rest
}: DataGridProps<T>) {
  const captionContent = useBionicChildren(caption, bionic, bionicOptions);
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const getRowKey = (row: T): string =>
    typeof rowKey === "string" ? String(defaultAccessor(row, rowKey)) : rowKey(row);

  const gridColumns: TableColumn<T>[] = columns.map((col) => {
    if (!editable || col.render) return col;
    return {
      ...col,
      render: (value: unknown, row: T) => (
        <EditableCell
          value={value}
          label={col.header}
          onSubmit={(newValue) => onCellChange?.(getRowKey(row), col.key, newValue)}
        />
      ),
    };
  });

  const nestedTableProps = {
    sort,
    onSortChange,
    selectedRowKeys,
    onSelectedRowKeysChange,
    pageSize,
    page,
    onPageChange,
    loading,
    emptyMessage,
    maxHeight,
    "aria-label": ariaLabel,
    bionic,
    bionicOptions,
  };

  if (!groupBy) {
    return (
      <div className={clsx("rebar-data-grid", className)} data-rebar-component="data-grid" {...rest}>
        <Table columns={gridColumns} data={data} rowKey={rowKey} caption={caption} {...nestedTableProps} />
      </div>
    );
  }

  const groupCol = columns.find((c) => c.key === groupBy);
  const groupAccessor = groupCol?.accessor ?? ((row: T) => defaultAccessor(row, groupBy));

  const groups: { label: string; rows: T[] }[] = [];
  const groupIndexByLabel = new Map<string, number>();
  for (const row of data) {
    const raw = groupAccessor(row);
    const label = raw === undefined || raw === null || raw === "" ? "(none)" : String(raw);
    let idx = groupIndexByLabel.get(label);
    if (idx === undefined) {
      idx = groups.length;
      groupIndexByLabel.set(label, idx);
      groups.push({ label, rows: [] });
    }
    groups[idx]!.rows.push(row);
  }

  return (
    <div className={clsx("rebar-data-grid", className)} data-rebar-component="data-grid" {...rest}>
      {caption ? (
        <div className="rebar-table-caption" data-rebar-part="caption">
          {captionContent}
        </div>
      ) : null}
      <Accordion type="multiple" defaultValue={groups.map((g) => g.label)}>
        {groups.map((group) => (
          <AccordionItem
            key={group.label}
            value={group.label}
            trigger={
              <span data-rebar-part="group-header">
                {renderBionicChildren(group.label, bionicEnabled, bionicOptions)} ({group.rows.length})
              </span>
            }
          >
            <Table columns={gridColumns} data={group.rows} rowKey={rowKey} {...nestedTableProps} />
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
