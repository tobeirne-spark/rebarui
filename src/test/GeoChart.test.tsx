import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GeoChart } from "../components/GeoChart";

afterEach(cleanup);

describe("GeoChart", () => {
  const regions = [
    { id: "north", label: "North", value: 10 },
    { id: "south", label: "South", value: 40 },
    { id: "east", label: "East", value: 25 },
  ];
  const layout = [
    { id: "north", row: 0, col: 1 },
    { id: "south", row: 1, col: 0 },
    { id: "east", row: 1, col: 1 },
  ];

  it("renders a real svg with an accessible name from title when ariaLabel is omitted", () => {
    render(<GeoChart regions={regions} layout={layout} title="Regional volume" />);
    expect(screen.getByRole("img", { name: "Regional volume" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<GeoChart regions={regions} layout={layout} title="Regional volume" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<GeoChart regions={regions} layout={layout} title="Regional volume" />);
    expect(screen.getByText("Regional volume")).toBeInTheDocument();
    rerender(<GeoChart regions={regions} layout={layout} ariaLabel="Regional volume chart" />);
    expect(screen.queryByText("Regional volume")).not.toBeInTheDocument();
  });

  it("renders one rect per region", () => {
    const { container } = render(<GeoChart regions={regions} layout={layout} title="Regional volume" />);
    expect(container.querySelectorAll("rect")).toHaveLength(regions.length);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<GeoChart regions={regions} layout={layout} title="Regional volume" />);
    expect(container.querySelector('[data-rebar-component="geo-chart"]')).toBeInTheDocument();
  });

  it("renders each region's label inside its cell", () => {
    render(<GeoChart regions={regions} layout={layout} title="Regional volume" />);
    expect(screen.getByText("North")).toBeInTheDocument();
    expect(screen.getByText("South")).toBeInTheDocument();
    expect(screen.getByText("East")).toBeInTheDocument();
  });

  it("auto-lays-out regions into a sensible, non-overlapping grid when layout is omitted", () => {
    const { container } = render(<GeoChart regions={regions} title="Regional volume" />);
    const rects = Array.from(container.querySelectorAll('rect[data-rebar-part="region"]'));
    expect(rects).toHaveLength(regions.length);
    // Every region must land at a distinct (x, y) position — no two regions stacked on top of
    // each other, which is exactly the failure mode a naive/buggy auto-layout would produce.
    const positions = rects.map((r) => `${r.getAttribute("x")},${r.getAttribute("y")}`);
    expect(new Set(positions).size).toBe(regions.length);
  });
});
