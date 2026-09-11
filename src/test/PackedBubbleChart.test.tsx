import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PackedBubbleChart } from "../components/PackedBubbleChart";
import type { PackedBubbleItem } from "../components/PackedBubbleChart";

afterEach(cleanup);

function getCircles(container: HTMLElement) {
  return Array.from(container.querySelectorAll('circle[data-rebar-part="mark"]')).map((c) => ({
    x: Number(c.getAttribute("cx")),
    y: Number(c.getAttribute("cy")),
    r: Number(c.getAttribute("r")),
  }));
}

describe("PackedBubbleChart", () => {
  const flatItems: PackedBubbleItem[] = [
    { label: "A", value: 100 },
    { label: "B", value: 64 },
    { label: "C", value: 36 },
    { label: "D", value: 16 },
    { label: "E", value: 81 },
    { label: "F", value: 25 },
    { label: "G", value: 49 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<PackedBubbleChart items={flatItems} title="Vector DB chunks" />);
    expect(screen.getByRole("img", { name: "Vector DB chunks" })).toBeInTheDocument();
  });

  it("renders one real, non-overlapping circle per item — the actual point of a packed layout", () => {
    const { container } = render(<PackedBubbleChart items={flatItems} title="t" />);
    const circles = getCircles(container);
    expect(circles).toHaveLength(flatItems.length);
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i]!;
        const b = circles[j]!;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        // A tiny epsilon for floating-point scaling error — real overlap would fail this by a
        // wide margin, not a fraction of a pixel.
        expect(dist).toBeGreaterThanOrEqual(a.r + b.r - 0.5);
      }
    }
  });

  it("grouped mode packs same-group items into their own cluster with a visible group boundary", () => {
    const grouped: PackedBubbleItem[] = [
      { label: "A1", value: 40, group: "Cluster A" },
      { label: "A2", value: 30, group: "Cluster A" },
      { label: "B1", value: 50, group: "Cluster B" },
      { label: "B2", value: 20, group: "Cluster B" },
    ];
    const { container } = render(<PackedBubbleChart items={grouped} title="t" />);
    expect(container.querySelectorAll('[data-rebar-part="group"]')).toHaveLength(2);
    const circles = getCircles(container);
    expect(circles).toHaveLength(4);
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i]!;
        const b = circles[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 0.5);
      }
    }
  });

  it("auto-detects grouped mode from item.group without an explicit grouped prop", () => {
    const grouped: PackedBubbleItem[] = [
      { label: "A1", value: 40, group: "X" },
      { label: "B1", value: 50, group: "Y" },
    ];
    const { container } = render(<PackedBubbleChart items={grouped} title="t" />);
    expect(container.querySelectorAll('[data-rebar-part="group"]')).toHaveLength(2);
  });

  it("grouped can be forced false even when items set group, falling back to flat packing", () => {
    const grouped: PackedBubbleItem[] = [
      { label: "A1", value: 40, group: "X" },
      { label: "B1", value: 50, group: "Y" },
    ];
    const { container } = render(<PackedBubbleChart items={grouped} grouped={false} title="t" />);
    expect(container.querySelectorAll('[data-rebar-part="group"]')).toHaveLength(0);
  });

  it("a single item renders without crashing (no pair to compute a tangent against)", () => {
    render(<PackedBubbleChart items={[{ label: "Solo", value: 10 }]} title="t" />);
    expect(screen.getByText("Solo")).toBeInTheDocument();
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<PackedBubbleChart items={[]} title="Vector DB chunks" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
