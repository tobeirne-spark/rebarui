import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StepChart } from "../components/StepChart";

afterEach(cleanup);

describe("StepChart", () => {
  const series = [{ label: "Rate", values: [1, 2, 2, 4] }];
  const xLabels = ["Q1", "Q2", "Q3", "Q4"];

  it("renders a real svg with an accessible name from title", () => {
    render(<StepChart series={series} xLabels={xLabels} title="Interest rate" />);
    expect(screen.getByRole("img", { name: "Interest rate" })).toBeInTheDocument();
  });

  it("renders a right-angle staircase path, not a diagonal polyline", () => {
    const { container } = render(<StepChart series={series} xLabels={xLabels} title="Interest rate" />);
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
    // step="after" (the default) with 4 points produces 1 initial point + 2 extra points per
    // subsequent step (a horizontal-then-vertical corner) = 1 + 3*2 = 7 coordinate pairs.
    const d = path?.getAttribute("d") ?? "";
    const coordCount = d.split(" ").filter((s) => s.includes(",")).length;
    expect(coordCount).toBe(7);
  });

  it("supports step='before' and step='middle' as distinct paths from the default", () => {
    const { container: after } = render(<StepChart series={series} xLabels={xLabels} title="t" step="after" />);
    const { container: before } = render(<StepChart series={series} xLabels={xLabels} title="t" step="before" />);
    const { container: middle } = render(<StepChart series={series} xLabels={xLabels} title="t" step="middle" />);
    const dAfter = after.querySelector("path")?.getAttribute("d");
    const dBefore = before.querySelector("path")?.getAttribute("d");
    const dMiddle = middle.querySelector("path")?.getAttribute("d");
    expect(dAfter).not.toBe(dBefore);
    expect(dAfter).not.toBe(dMiddle);
  });

  it("renders a trendline only when trendline is set", () => {
    const { container, rerender } = render(<StepChart series={series} xLabels={xLabels} title="t" />);
    expect(container.querySelector('[data-rebar-part="trendline"]')).not.toBeInTheDocument();
    rerender(<StepChart series={series} xLabels={xLabels} title="t" trendline />);
    expect(container.querySelector('[data-rebar-part="trendline"]')).toBeInTheDocument();
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<StepChart series={[]} xLabels={[]} title="Interest rate" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
