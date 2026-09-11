import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Histogram } from "../components/Histogram";

afterEach(cleanup);

describe("Histogram", () => {
  it("renders a real svg with an accessible name from title", () => {
    render(<Histogram series={[{ label: "Scores", values: [1, 2, 2, 3, 3, 3, 4, 4, 5] }]} title="Score distribution" />);
    expect(screen.getByRole("img", { name: "Score distribution" })).toBeInTheDocument();
  });

  it("bins raw values rather than plotting one bar per value", () => {
    const { container } = render(
      <Histogram
        series={[{ label: "Scores", values: [1, 2, 2, 3, 3, 3, 4, 4, 5] }]}
        title="t"
        binCount={5}
      />,
    );
    // 9 raw values but only up to binCount (5) bars, since several values share a bin.
    const bars = container.querySelectorAll('[data-rebar-part="mark"]');
    expect(bars.length).toBeLessThanOrEqual(5);
    expect(bars.length).toBeGreaterThan(0);
  });

  it("respects an explicit binCount", () => {
    const { container } = render(<Histogram series={[{ label: "s", values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }]} title="t" binCount={2} />);
    const bars = container.querySelectorAll('[data-rebar-part="mark"]');
    expect(bars.length).toBeLessThanOrEqual(2);
  });

  it("only shows a legend for multiple series", () => {
    const { rerender } = render(<Histogram series={[{ label: "A", values: [1, 2, 3] }]} title="t" />);
    expect(screen.queryByText("A", { selector: "text" })).not.toBeInTheDocument();
    rerender(
      <Histogram
        series={[
          { label: "A", values: [1, 2, 3] },
          { label: "B", values: [4, 5, 6] },
        ]}
        title="t"
      />,
    );
    expect(screen.getByText("A", { selector: "text" })).toBeInTheDocument();
    expect(screen.getByText("B", { selector: "text" })).toBeInTheDocument();
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<Histogram series={[]} title="Score distribution" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
