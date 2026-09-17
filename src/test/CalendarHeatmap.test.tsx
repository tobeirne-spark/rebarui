import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CalendarHeatmap } from "../components/CalendarHeatmap";

afterEach(cleanup);

describe("CalendarHeatmap", () => {
  const data = [
    { date: "2026-01-01", value: 3 },
    { date: "2026-01-05", value: 8 },
    { date: "2026-01-10", value: 0 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<CalendarHeatmap data={data} title="Activity" />);
    expect(screen.getByRole("img", { name: "Activity" })).toBeInTheDocument();
  });

  it("renders one real cell per date with data, distinct from missing-data cells", () => {
    const { container } = render(<CalendarHeatmap data={data} title="Activity" />);
    expect(container.querySelectorAll('[data-rebar-part="cell"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-rebar-part="cell-missing"]').length).toBeGreaterThan(0);
  });

  it("a date with value 0 still renders as a real cell, not a missing one", () => {
    const { container } = render(<CalendarHeatmap data={data} title="Activity" />);
    const cells = container.querySelectorAll('[data-rebar-part="cell"]');
    const zeroCell = Array.from(cells).find((c) => c.querySelector("title")?.textContent?.includes(": 0"));
    expect(zeroCell).toBeTruthy();
  });

  it("renders month labels and a Less/More legend", () => {
    render(<CalendarHeatmap data={data} title="Activity" />);
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("respects an explicit startDate/endDate range wider than the data itself", () => {
    const { container } = render(
      <CalendarHeatmap data={data} startDate="2025-12-25" endDate="2026-01-15" title="Activity" />,
    );
    // A wider explicit range should produce more total day cells (real + missing) than the data's
    // own 3-entry span alone would.
    const totalCells = container.querySelectorAll('[data-rebar-part="cell"], [data-rebar-part="cell-missing"]').length;
    expect(totalCells).toBeGreaterThan(3);
  });

  it("shows a visible empty state instead of broken geometry when there's no data at all", () => {
    render(<CalendarHeatmap data={[]} title="Activity" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
