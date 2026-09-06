import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { PivotTable } from "../components/PivotTable";

afterEach(cleanup);

// North/Widget, North/Gadget, South/Widget only — South/Gadget is deliberately absent so every
// aggregate has a real zero-match cell to verify (never NaN, never a crash). Values are chosen so
// every aggregate (sum/count/average) works out to clean numbers, including the grand total.
const data = [
  { region: "North", product: "Widget", sales: 10 },
  { region: "North", product: "Gadget", sales: 20 },
  { region: "South", product: "Widget", sales: 30 },
];

function cellTextsOf(row: HTMLElement): (string | null)[] {
  return within(row).getAllByRole("cell").map((cell) => cell.textContent);
}

function headerTextsOf(row: HTMLElement): (string | null)[] {
  return within(row).getAllByRole("columnheader").map((cell) => cell.textContent);
}

describe("PivotTable", () => {
  it("carries the expected data-rebar-component attribute and renders a visible title", () => {
    const { container } = render(
      <PivotTable data={data} rowField="region" colField="product" valueField="sales" title="Sales by region" />,
    );
    expect(container.querySelector('[data-rebar-component="pivot-table"]')).toBeInTheDocument();
    expect(screen.getByText("Sales by region")).toBeInTheDocument();
  });

  it("aggregates via sum by default, with real row/column totals and a real 0 for the row×col combination with no matching data", () => {
    render(<PivotTable data={data} rowField="region" colField="product" valueField="sales" />);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(4); // header, North, South, Total
    expect(cellTextsOf(rows[1]!)).toEqual(["North", "10", "20", "30"]);
    expect(cellTextsOf(rows[2]!)).toEqual(["South", "30", "0", "30"]);
    expect(cellTextsOf(rows[3]!)).toEqual(["Total", "40", "20", "60"]);
  });

  it("aggregates via count", () => {
    render(<PivotTable data={data} rowField="region" colField="product" valueField="sales" aggregate="count" />);
    const rows = screen.getAllByRole("row");
    expect(cellTextsOf(rows[1]!)).toEqual(["North", "1", "1", "2"]);
    expect(cellTextsOf(rows[2]!)).toEqual(["South", "1", "0", "1"]);
    expect(cellTextsOf(rows[3]!)).toEqual(["Total", "2", "1", "3"]);
  });

  it("aggregates via average, including a real 0 (not NaN) for a zero-match cell", () => {
    render(<PivotTable data={data} rowField="region" colField="product" valueField="sales" aggregate="average" />);
    const rows = screen.getAllByRole("row");
    expect(cellTextsOf(rows[1]!)).toEqual(["North", "10", "20", "15"]);
    expect(cellTextsOf(rows[2]!)).toEqual(["South", "30", "0", "30"]);
    expect(cellTextsOf(rows[3]!)).toEqual(["Total", "20", "20", "20"]);
  });

  it("derives row and column headers from data in first-seen order, not sorted", () => {
    const unordered = [
      { region: "South", product: "Gadget", sales: 1 },
      { region: "North", product: "Widget", sales: 2 },
    ];
    render(<PivotTable data={unordered} rowField="region" colField="product" valueField="sales" />);
    const rows = screen.getAllByRole("row");
    expect(headerTextsOf(rows[0]!)).toEqual(["region", "Gadget", "Widget", "Total"]);
    expect(cellTextsOf(rows[1]!)).toEqual(["South", "1", "0", "1"]);
    expect(cellTextsOf(rows[2]!)).toEqual(["North", "0", "2", "2"]);
  });
});
