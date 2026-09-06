import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RadarChart } from "../components/RadarChart";

afterEach(cleanup);

describe("RadarChart", () => {
  const axes = ["Speed", "Power", "Range", "Comfort", "Price"];
  const series = [
    { label: "Model A", values: [80, 60, 70, 50, 90] },
    { label: "Model B", values: [60, 90, 50, 80, 40] },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<RadarChart axes={axes} series={series} title="Spec comparison" />);
    expect(screen.getByRole("img", { name: "Spec comparison" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<RadarChart axes={axes} series={series} title="Spec comparison" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<RadarChart axes={axes} series={series} title="Spec comparison" />);
    expect(screen.getByText("Spec comparison")).toBeInTheDocument();
    rerender(<RadarChart axes={axes} series={series} ariaLabel="Spec comparison chart" />);
    expect(screen.queryByText("Spec comparison")).not.toBeInTheDocument();
  });

  it("renders one axis line and one axis label per axis, and one polygon per series", () => {
    const { container } = render(<RadarChart axes={axes} series={series} title="Spec comparison" />);
    expect(container.querySelectorAll('[data-rebar-part="radar-axis-line"]')).toHaveLength(axes.length);
    axes.forEach((axis) => expect(screen.getByText(axis)).toBeInTheDocument());
    expect(container.querySelectorAll('[data-rebar-part="radar-series"]')).toHaveLength(series.length);
  });

  it("renders a legend item with a label and swatch per series", () => {
    const { container } = render(<RadarChart axes={axes} series={series} title="Spec comparison" />);
    const legendItems = container.querySelectorAll('[data-rebar-part="legend-item"]');
    expect(legendItems).toHaveLength(series.length);
    expect(container.querySelectorAll('[data-rebar-part="legend-swatch"]')).toHaveLength(series.length);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<RadarChart axes={axes} series={series} title="Spec comparison" />);
    expect(container.querySelector('[data-rebar-component="radar-chart"]')).toBeInTheDocument();
  });

  it("handles a degenerate 3-axis polygon without collapsing series or axis counts", () => {
    const smallAxes = ["Speed", "Power", "Range"];
    const smallSeries = [{ label: "Only entry", values: [10, 10, 10] }];
    const { container } = render(<RadarChart axes={smallAxes} series={smallSeries} title="Minimal radar" />);
    expect(container.querySelectorAll('[data-rebar-part="radar-axis-line"]')).toHaveLength(3);
    const polygon = container.querySelector('[data-rebar-part="radar-series"]');
    expect(polygon).toBeInTheDocument();
    // Equal values on every axis produce exactly 3 distinct vertices (a small equilateral triangle).
    const points = polygon?.getAttribute("points")?.trim().split(" ") ?? [];
    expect(points).toHaveLength(3);
  });
});
