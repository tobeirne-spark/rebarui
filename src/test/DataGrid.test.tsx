import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataGrid } from "../components/DataGrid";
import type { TableColumn } from "../components/Table";

afterEach(cleanup);

interface Row {
  id: string;
  name: string;
  team: string;
}

const rows: Row[] = [
  { id: "a", name: "Alpha", team: "Red" },
  { id: "b", name: "Beta", team: "Blue" },
  { id: "c", name: "Gamma", team: "Red" },
];

const columns: TableColumn<Row>[] = [{ key: "name", header: "Name" }];
const columnsWithTeam: TableColumn<Row>[] = [
  { key: "name", header: "Name" },
  { key: "team", header: "Team" },
];

describe("DataGrid", () => {
  it("carries the expected data-rebar-component attribute and renders a plain table by default", () => {
    const { container } = render(<DataGrid columns={columns} data={rows} rowKey="id" />);
    expect(container.querySelector('[data-rebar-component="data-grid"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-component="table"]')).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("renders plain text, not an Editable trigger, when editable is not set", () => {
    render(<DataGrid columns={columns} data={rows} rowKey="id" />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /click to edit/ })).not.toBeInTheDocument();
  });

  it("clicking an editable cell shows a real input, and typing plus blurring fires onCellChange with the row/column/value", async () => {
    const user = userEvent.setup();
    const onCellChange = vi.fn();
    const singleRow: Row[] = [{ id: "a", name: "Alpha", team: "Red" }];
    render(<DataGrid columns={columns} data={singleRow} rowKey="id" editable onCellChange={onCellChange} />);

    const trigger = screen.getByRole("button", { name: /Name, click to edit/ });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(trigger);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Alpha");

    await user.type(input, "!");
    await user.tab();

    expect(onCellChange).toHaveBeenLastCalledWith("a", "name", "Alpha!");
  });

  it("does not wrap a column that already has its own render in Editable, even when editable is set", () => {
    const customColumns: TableColumn<Row>[] = [
      { key: "name", header: "Name", render: (value) => <em>{String(value)}</em> },
    ];
    render(<DataGrid columns={customColumns} data={rows} rowKey="id" editable />);
    expect(screen.queryByRole("button", { name: /click to edit/ })).not.toBeInTheDocument();
  });

  it("groups rows under real, collapsible group-header rows showing the group's value and row count", () => {
    render(<DataGrid columns={columnsWithTeam} data={rows} rowKey="id" groupBy="team" />);
    expect(screen.getByRole("button", { name: /Red \(2\)/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Blue \(1\)/ })).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("collapsing a group hides its rows without affecting other groups", async () => {
    const user = userEvent.setup();
    render(<DataGrid columns={columnsWithTeam} data={rows} rowKey="id" groupBy="team" />);

    await user.click(screen.getByRole("button", { name: /Red \(2\)/ }));

    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
});
