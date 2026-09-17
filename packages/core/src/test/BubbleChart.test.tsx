import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BubbleChart } from "../components/BubbleChart";

function getBubble(container: HTMLElement, index: number) {
  return container.querySelectorAll('[data-rebar-part="bubble"]')[index] as HTMLElement;
}

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

afterEach(cleanup);

describe("BubbleChart", () => {
  const series = [
    {
      label: "Set A",
      points: [
        { x: 1, y: 10, size: 5 },
        { x: 2, y: 14, size: 20 },
      ],
    },
    {
      label: "Set B",
      points: [
        { x: 3, y: 8, size: 12 },
      ],
    },
  ];

  it("renders a real svg with an accessible name from title when ariaLabel is omitted", () => {
    render(<BubbleChart series={series} title="Cost vs. quality" />);
    expect(screen.getByRole("img", { name: "Cost vs. quality" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<BubbleChart series={series} title="Cost vs. quality" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    expect(screen.getByText("Cost vs. quality")).toBeInTheDocument();
    rerender(<BubbleChart series={series} ariaLabel="Cost vs. quality chart" />);
    expect(screen.queryByText("Cost vs. quality")).not.toBeInTheDocument();
  });

  it("renders one circle per point across all series", () => {
    const { container } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    expect(container.querySelectorAll("circle")).toHaveLength(3);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    expect(container.querySelector('[data-rebar-component="bubble-chart"]')).toBeInTheDocument();
  });

  it("cycles through the default palette when series omit their own color", () => {
    const { container } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    const circles = Array.from(container.querySelectorAll("circle"));
    const firstSeriesColor = circles[0]?.getAttribute("fill");
    const thirdCircleColor = circles[2]?.getAttribute("fill");
    expect(firstSeriesColor).not.toBe(thirdCircleColor);
  });

  it("scales radius from size (sqrt scaling) while keeping every point within the clamp bounds", () => {
    const wideRange = [
      {
        label: "Set A",
        points: [
          { x: 1, y: 1, size: 1 },
          { x: 2, y: 2, size: 10000 },
        ],
      },
    ];
    const { container } = render(<BubbleChart series={wideRange} title="Extreme sizes" />);
    const circles = Array.from(container.querySelectorAll("circle"));
    expect(circles).toHaveLength(2);
    const radii = circles.map((c) => Number(c.getAttribute("r")));

    // The two very-differently-sized points must map to different radii...
    expect(radii[0]).not.toBe(radii[1]);
    // ...but neither vanishes to nothing nor blows up past the chart's clamp bounds (4-24px).
    for (const r of radii) {
      expect(r).toBeGreaterThanOrEqual(4);
      expect(r).toBeLessThanOrEqual(24);
    }
  });

  it("hovering a bubble shows its value tag; clicking persists it after the pointer leaves", () => {
    const { container } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    const bubble = getBubble(container, 1); // Set A, point 1: x2 y14 size20

    fireEvent.pointerEnter(bubble);
    expect(getTagLines(container)).toEqual(["Set A", "x: 2  y: 14", "size: 20"]);
    fireEvent.pointerLeave(bubble);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();

    fireEvent.click(bubble);
    fireEvent.pointerLeave(bubble);
    expect(getTagLines(container)).toEqual(["Set A", "x: 2  y: 14", "size: 20"]);
  });

  it("a dead click on empty chart space clears the persistent selection", () => {
    const { container } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    const bubble = getBubble(container, 0);
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.click(bubble);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).toBeInTheDocument();
    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });

  it("renders a trendline per series only when trendline is set", () => {
    const { container, rerender } = render(<BubbleChart series={series} title="Cost vs. quality" />);
    expect(container.querySelectorAll('[data-rebar-part="trendline"]')).toHaveLength(0);
    rerender(<BubbleChart series={series} title="Cost vs. quality" trendline />);
    expect(container.querySelectorAll('[data-rebar-part="trendline"]').length).toBeGreaterThan(0);
  });
});
