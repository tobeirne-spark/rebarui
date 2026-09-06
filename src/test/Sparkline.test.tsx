import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Sparkline } from "../components/Sparkline";

afterEach(cleanup);

describe("Sparkline", () => {
  it("renders a real svg with the required accessible name", () => {
    render(<Sparkline values={[1, 4, 2, 8, 5]} ariaLabel="Last 5 days" />);
    expect(screen.getByRole("img", { name: "Last 5 days" })).toBeInTheDocument();
  });

  it("renders exactly one polyline and no axis chrome (no line ticks, no text labels)", () => {
    const { container } = render(<Sparkline values={[1, 4, 2, 8, 5]} ariaLabel="Trend" />);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(container.querySelectorAll("line")).toHaveLength(0);
    expect(container.querySelectorAll("text")).toHaveLength(0);
  });

  it("applies the default width/height when not given", () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} ariaLabel="Trend" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("respects a custom width/height", () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} ariaLabel="Trend" width={200} height={50} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "200");
    expect(svg).toHaveAttribute("height", "50");
  });

  it("renders a flat line without NaN points for a single value", () => {
    const { container } = render(<Sparkline values={[42]} ariaLabel="Single point" />);
    const polyline = container.querySelector("polyline");
    expect(polyline?.getAttribute("points")).not.toContain("NaN");
    expect(polyline?.getAttribute("points")?.trim().split(/\s+/)).toHaveLength(2);
  });

  it("uses the given color for the line", () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} ariaLabel="Trend" color="#d32f2f" />);
    expect(container.querySelector("polyline")).toHaveAttribute("stroke", "#d32f2f");
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} ariaLabel="Trend" />);
    expect(container.querySelector('[data-rebar-component="sparkline"]')).toBeInTheDocument();
  });
});
