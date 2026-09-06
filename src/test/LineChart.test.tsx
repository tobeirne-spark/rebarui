import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LineChart } from "../components/LineChart";

afterEach(cleanup);

describe("LineChart", () => {
  const series = [
    { label: "antd", values: [10, 20, 30] },
    { label: "rebar-ui", values: [8, 15, 22] },
  ];
  const xLabels = ["R0", "R1", "R2"];

  it("renders a real svg with an accessible name from title", () => {
    render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(screen.getByRole("img", { name: "Cumulative cost" })).toBeInTheDocument();
  });

  it("renders one polyline per series and one circle per value", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
    expect(container.querySelectorAll("circle")).toHaveLength(6);
  });

  it("renders a dashed line for a series flagged dashed, solid for one that isn't", () => {
    const { container } = render(
      <LineChart
        series={[
          { label: "antd", values: [1, 2, 3] },
          { label: "rebar-ui + migration", values: [1, 2, 3], dashed: true },
        ]}
        xLabels={xLabels}
        title="Cumulative cost"
      />,
    );
    const polylines = container.querySelectorAll("polyline");
    expect(polylines[0]).not.toHaveAttribute("stroke-dasharray");
    expect(polylines[1]).toHaveAttribute("stroke-dasharray", "6 4");
  });

  it("renders a crossover marker and label when crossoverIndex is set, omits it otherwise", () => {
    const { container, rerender } = render(
      <LineChart series={series} xLabels={xLabels} title="Cumulative cost" crossoverIndex={1} />,
    );
    expect(screen.getByText("crossover")).toBeInTheDocument();
    rerender(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(screen.queryByText("crossover")).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(container.querySelector('[data-rebar-component="line-chart"]')).toBeInTheDocument();
  });
});
