import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SteppedBarChart } from "../components/SteppedBarChart";

afterEach(cleanup);

describe("SteppedBarChart", () => {
  const bars = [
    { label: "Mon", value: 10 },
    { label: "Tue", value: 25 },
    { label: "Wed", value: 15 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<SteppedBarChart bars={bars} title="Daily count" />);
    expect(screen.getByRole("img", { name: "Daily count" })).toBeInTheDocument();
  });

  it("renders bars touching (no gap) by spanning the full band width each", () => {
    const { container } = render(<SteppedBarChart bars={bars} title="Daily count" />);
    const rects = Array.from(container.querySelectorAll("rect")).filter((r) => r.getAttribute("width") !== undefined && r !== container.querySelector('[data-rebar-part="chart-background"]'));
    // Every bar rect should share the exact same width (the full band), confirming no per-bar gutter.
    const widths = new Set(rects.map((r) => r.getAttribute("width")));
    expect(widths.size).toBe(1);
  });

  it("renders one continuous stepped outline polyline across every bar's own top", () => {
    const { container } = render(<SteppedBarChart bars={bars} title="Daily count" />);
    const outline = container.querySelector('[data-rebar-part="outline"]');
    expect(outline).toBeInTheDocument();
    // 3 bars -> 2 points per bar top (left, right) = 6 coordinate pairs.
    const points = outline?.getAttribute("points")?.trim().split(" ") ?? [];
    expect(points).toHaveLength(6);
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<SteppedBarChart bars={[]} title="Daily count" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
