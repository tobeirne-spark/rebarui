import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { IndexChart } from "../components/IndexChart";

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

afterEach(cleanup);

describe("IndexChart", () => {
  const series = [
    { label: "Stock A", values: [50, 55, 60] },
    { label: "Stock B", values: [200, 220, 180] },
  ];
  const xLabels = ["Jan", "Feb", "Mar"];

  it("renders a real svg with an accessible name from title", () => {
    render(<IndexChart series={series} xLabels={xLabels} title="Relative performance" />);
    expect(screen.getByRole("img", { name: "Relative performance" })).toBeInTheDocument();
  });

  it("rebases every series to baseValue (100 by default) at its own first point", () => {
    const { container } = render(<IndexChart series={series} xLabels={xLabels} title="Relative performance" />);
    // Stock A: 50 -> 100, 55 -> 110, 60 -> 120 (series index 0). Stock B: 200 -> 100, 220 -> 110,
    // 180 -> 90 (series index 1). Hover each mark and read the real rebased value off its tooltip,
    // rather than assuming the y-axis tick grid happens to land on these exact numbers.
    const marks = container.querySelectorAll('[data-rebar-part="mark"]');
    fireEvent.pointerEnter(marks[1]!); // Stock A, second point
    expect(getTagLines(container)).toEqual(["Stock A", "Feb: 110"]);
    fireEvent.pointerEnter(marks[2]!); // Stock A, third point
    expect(getTagLines(container)).toEqual(["Stock A", "Mar: 120"]);
    fireEvent.pointerEnter(marks[5]!); // Stock B, third point
    expect(getTagLines(container)).toEqual(["Stock B", "Mar: 90"]);
  });

  it("respects a custom baseValue, including the reference-line label", () => {
    const { container } = render(
      <IndexChart series={series} xLabels={xLabels} title="Relative performance" baseValue={1000} />,
    );
    const marks = container.querySelectorAll('[data-rebar-part="mark"]');
    fireEvent.pointerEnter(marks[0]!); // Stock A, first point — always rebased to baseValue exactly
    expect(getTagLines(container)).toEqual(["Stock A", "Jan: 1000"]);
    expect(screen.getByText("1000")).toBeInTheDocument(); // the reference-line label itself
  });

  it("renders one polyline per series", () => {
    const { container } = render(<IndexChart series={series} xLabels={xLabels} title="Relative performance" />);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
  });

  it("renders a trendline per series only when trendline is set", () => {
    const { container, rerender } = render(<IndexChart series={series} xLabels={xLabels} title="t" />);
    expect(container.querySelectorAll('[data-rebar-part="trendline"]')).toHaveLength(0);
    rerender(<IndexChart series={series} xLabels={xLabels} title="t" trendline />);
    expect(container.querySelectorAll('[data-rebar-part="trendline"]')).toHaveLength(2);
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<IndexChart series={[]} xLabels={[]} title="Relative performance" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("a series starting at 0 stays flat at baseValue rather than dividing by zero", () => {
    render(<IndexChart series={[{ label: "Zero start", values: [0, 10, 20] }]} xLabels={xLabels} title="t" />);
    expect(screen.getAllByText("100").length).toBeGreaterThan(0);
  });
});
