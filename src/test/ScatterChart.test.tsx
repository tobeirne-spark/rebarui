import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ScatterChart } from "../components/ScatterChart";

afterEach(cleanup);

describe("ScatterChart", () => {
  const series = [
    { label: "antd", values: [10, 12, 11] },
    { label: "rebar-ui", values: [8, 9, 8.5] },
  ];

  it("renders a real svg with an accessible name from title when ariaLabel is omitted", () => {
    render(<ScatterChart series={series} title="Token cost" />);
    expect(screen.getByRole("img", { name: "Token cost" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<ScatterChart series={series} title="Token cost" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<ScatterChart series={series} title="Token cost" />);
    expect(screen.getByText("Token cost")).toBeInTheDocument();
    rerender(<ScatterChart series={series} ariaLabel="Token cost chart" />);
    expect(screen.queryByText("Token cost")).not.toBeInTheDocument();
  });

  it("renders one point per value across all series, plus a mean line each", () => {
    const { container } = render(<ScatterChart series={series} title="Token cost" />);
    expect(container.querySelectorAll("circle")).toHaveLength(6);
    expect(container.querySelectorAll('line[stroke-dasharray="4 3"]')).toHaveLength(2);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<ScatterChart series={series} title="Token cost" />);
    expect(container.querySelector('[data-rebar-component="scatter-chart"]')).toBeInTheDocument();
  });

  it("cycles through the default palette when series omit their own color", () => {
    const { container } = render(<ScatterChart series={series} title="Token cost" />);
    const circles = Array.from(container.querySelectorAll("circle"));
    const firstSeriesColor = circles[0]?.getAttribute("fill");
    const secondSeriesColor = circles[3]?.getAttribute("fill");
    expect(firstSeriesColor).not.toBe(secondSeriesColor);
  });
});
