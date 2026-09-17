import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table } from "../components/Table";
import type { TableColumn } from "../components/Table";

afterEach(cleanup);

interface Row {
  id: string;
  name: string;
  count: number;
}

const rows: Row[] = [
  { id: "a", name: "Beta", count: 2 },
  { id: "b", name: "Alpha", count: 5 },
  { id: "c", name: "Gamma", count: 1 },
];

const columns: TableColumn<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "count", header: "Count", sortable: true, align: "right" },
];

describe("Table", () => {
  it("renders a real table with a row per data item and a cell per column", () => {
    render(<Table columns={columns} data={rows} rowKey={(r) => r.id} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("accepts a plain property name for rowKey, not just a function — the no-function-props path a Server Component needs", () => {
    render(<Table columns={columns} data={rows} rowKey="id" />);
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<Table columns={columns} data={rows} rowKey={(r) => r.id} />);
    expect(container.querySelector('[data-rebar-component="table"]')).toBeInTheDocument();
  });

  it("renders a real, visible caption when set", () => {
    render(<Table columns={columns} data={rows} rowKey={(r) => r.id} caption="Team roster" />);
    expect(screen.getByText("Team roster")).toBeInTheDocument();
  });

  it("sorts a column ascending, then descending, then back to unsorted on repeated clicks (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Table columns={columns} data={rows} rowKey={(r) => r.id} />);
    const nameHeaderButton = screen.getByRole("button", { name: /Name/ });

    await user.click(nameHeaderButton);
    let bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]!).getByText("Alpha")).toBeInTheDocument();

    await user.click(nameHeaderButton);
    bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]!).getByText("Gamma")).toBeInTheDocument();

    await user.click(nameHeaderButton);
    bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]!).getByText("Beta")).toBeInTheDocument();
  });

  it("calls onSortChange and stays controlled when sort is passed explicitly", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Table columns={columns} data={rows} rowKey={(r) => r.id} sort={null} onSortChange={onSortChange} />,
    );
    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: "asc" });
    // Controlled: sort prop didn't change, so the row order in the DOM stays as originally given.
    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]!).getByText("Beta")).toBeInTheDocument();
  });

  it("renders an Empty state when data is empty and not loading", () => {
    render(<Table columns={columns} data={[]} rowKey={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("warns in dev when a count-like column has no render (ref/HEURISTICS.md #54)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const countColumns: TableColumn<Row>[] = [
      { key: "name", header: "Name" },
      { key: "chunk_count", header: "Chunks" },
    ];
    render(<Table columns={countColumns} data={rows} rowKey={(r) => r.id} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('column "Chunks"'));
    warn.mockRestore();
  });

  it("does not warn for a count-like column that already has a render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const countColumns: TableColumn<Row>[] = [
      { key: "count", header: "Total", render: (v) => String(v) },
    ];
    render(<Table columns={countColumns} data={rows} rowKey={(r) => r.id} />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("renders skeleton rows when loading, not the empty state", () => {
    const { container } = render(<Table columns={columns} data={[]} rowKey={(r) => r.id} loading />);
    expect(screen.queryByText("No data.")).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-rebar-component="skeleton"]').length).toBeGreaterThan(0);
  });

  it("with loadingDelayMs set, a load that resolves before it elapses never shows skeleton rows", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Table columns={columns} data={[]} rowKey={(r) => r.id} loading loadingDelayMs={200} />,
    );
    expect(container.querySelectorAll('[data-rebar-component="skeleton"]').length).toBe(0);
    rerender(<Table columns={columns} data={[]} rowKey={(r) => r.id} loading={false} loadingDelayMs={200} />);
    act(() => vi.advanceTimersByTime(500));
    expect(container.querySelectorAll('[data-rebar-component="skeleton"]').length).toBe(0);
    vi.useRealTimers();
  });

  it("with no loadingDelayMs/loadingMinDurationMs set, loading still renders synchronously (unchanged default)", () => {
    const { container } = render(<Table columns={columns} data={[]} rowKey={(r) => r.id} loading />);
    expect(container.querySelectorAll('[data-rebar-component="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders a checkbox column and toggles row selection when selectedRowKeys is passed", async () => {
    const onSelectedRowKeysChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Table
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        selectedRowKeys={[]}
        onSelectedRowKeysChange={onSelectedRowKeysChange}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is "select all"; click the second (first row's checkbox).
    await user.click(checkboxes[1]!);
    expect(onSelectedRowKeysChange).toHaveBeenCalledWith(["a"]);
  });

  it("omits the checkbox column entirely when selectedRowKeys is not passed", () => {
    render(<Table columns={columns} data={rows} rowKey={(r) => r.id} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("paginates data via the real Pagination component when pageSize is set", () => {
    render(<Table columns={columns} data={rows} rowKey={(r) => r.id} pageSize={2} />);
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 rows on page 1
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
