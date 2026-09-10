import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Heatmap } from "../components/Heatmap";

function getCells(container: HTMLElement) {
  return container.querySelectorAll('rect[data-rebar-part="cell"], rect[data-rebar-part="cell-missing"]');
}

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

afterEach(cleanup);

describe("Heatmap", () => {
  // Sparse on purpose: "b"/"y" has no entry at all, distinct from a real value of 0.
  const data = [
    { row: "a", col: "x", value: 10 },
    { row: "a", col: "y", value: 0 },
    { row: "b", col: "x", value: 5 },
  ];
  const rows = ["a", "b"];
  const cols = ["x", "y"];

  it("renders a real svg with an accessible name from title when ariaLabel is omitted", () => {
    render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    expect(screen.getByRole("img", { name: "Usage density" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    expect(screen.getByText("Usage density")).toBeInTheDocument();
    rerender(<Heatmap data={data} rows={rows} cols={cols} ariaLabel="Usage density chart" />);
    expect(screen.queryByText("Usage density")).not.toBeInTheDocument();
  });

  it("renders one cell per row x col combination, including missing ones", () => {
    const { container } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    expect(getCells(container)).toHaveLength(rows.length * cols.length);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    expect(container.querySelector('[data-rebar-component="heatmap"]')).toBeInTheDocument();
  });

  it("infers rows/cols from data when not supplied explicitly", () => {
    const { container } = render(<Heatmap data={data} title="Usage density" />);
    // 2 unique rows (a, b) x 2 unique cols (x, y) = 4 cells.
    expect(getCells(container)).toHaveLength(4);
  });

  it("renders a missing row x col cell distinctly from a real value of 0", () => {
    const { container } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    const missingCell = container.querySelector('rect[data-row="b"][data-col="y"]');
    const realZeroCell = container.querySelector('rect[data-row="a"][data-col="y"]');
    expect(missingCell).toBeInTheDocument();
    expect(realZeroCell).toBeInTheDocument();
    expect(missingCell?.getAttribute("data-rebar-part")).toBe("cell-missing");
    expect(realZeroCell?.getAttribute("data-rebar-part")).toBe("cell");
    // The missing cell's fill must not be the same value as the real (if lowest) data point's fill —
    // an absent data point is not the same claim as "value is exactly 0".
    expect(missingCell?.getAttribute("fill")).not.toBe(realZeroCell?.getAttribute("fill"));
  });

  it("hovering a real cell shows its value tag; clicking persists it after the pointer leaves", () => {
    const { container } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    const cell = container.querySelector('rect[data-row="a"][data-col="x"]') as HTMLElement;

    fireEvent.pointerEnter(cell);
    expect(getTagLines(container)).toEqual(["a x x", "10"]);
    fireEvent.pointerLeave(cell);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();

    fireEvent.click(cell);
    fireEvent.pointerLeave(cell);
    expect(getTagLines(container)).toEqual(["a x x", "10"]);
  });

  it("a missing cell is not interactive (no hover handlers wired)", () => {
    const { container } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    const missingCell = container.querySelector('rect[data-row="b"][data-col="y"]') as HTMLElement;

    fireEvent.pointerEnter(missingCell);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });

  it("a dead click on empty chart space clears the persistent selection", () => {
    const { container } = render(<Heatmap data={data} rows={rows} cols={cols} title="Usage density" />);
    const cell = container.querySelector('rect[data-row="a"][data-col="x"]') as HTMLElement;
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.click(cell);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).toBeInTheDocument();
    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });
});
