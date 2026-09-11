import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AreaChart } from "../components/AreaChart";

function getMark(container: HTMLElement, index: number) {
  return container.querySelectorAll('[data-rebar-part="mark"]')[index] as HTMLElement;
}

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

afterEach(cleanup);

describe("AreaChart", () => {
  const series = [
    { label: "antd", values: [10, 20, 30] },
    { label: "rebar-ui", values: [8, 15, 22] },
  ];
  const xLabels = ["R0", "R1", "R2"];

  it("renders a real svg with an accessible name from title", () => {
    render(<AreaChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(screen.getByRole("img", { name: "Cumulative cost" })).toBeInTheDocument();
  });

  it("renders one filled area polygon and one line polyline per series, plus one circle per value", () => {
    const { container } = render(<AreaChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(container.querySelectorAll("polygon")).toHaveLength(2);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
    expect(container.querySelectorAll("circle")).toHaveLength(6);
  });

  it("fills each area with the series' own color at low opacity", () => {
    const { container } = render(
      <AreaChart
        series={[{ label: "one", color: "#0066cc", values: [1, 2, 3] }]}
        xLabels={xLabels}
        title="Single series"
      />,
    );
    const polygon = container.querySelector("polygon");
    expect(polygon).toHaveAttribute("fill", "#0066cc");
    expect(polygon).toHaveAttribute("fill-opacity", "0.18");
  });

  it("renders a title as a real visible caption, not just an accessible name", () => {
    const { container } = render(<AreaChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const caption = container.querySelector('[data-rebar-part="title"]');
    expect(caption?.tagName.toLowerCase()).toBe("figcaption");
    expect(caption).toHaveTextContent("Cumulative cost");
  });

  it("omits the figcaption entirely when no title is given", () => {
    const { container } = render(<AreaChart series={series} xLabels={xLabels} />);
    expect(container.querySelector('[data-rebar-part="title"]')).not.toBeInTheDocument();
  });

  it("closes the area polygon down to the baseline without producing NaN points for a flat series", () => {
    const { container } = render(
      <AreaChart series={[{ label: "flat", values: [5, 5, 5] }]} xLabels={xLabels} title="Flat series" />,
    );
    const polygon = container.querySelector("polygon");
    expect(polygon?.getAttribute("points")).not.toContain("NaN");
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<AreaChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(container.querySelector('[data-rebar-component="area-chart"]')).toBeInTheDocument();
  });

  it("hovering a mark shows its value tag; clicking persists it after the pointer leaves", () => {
    const { container } = render(<AreaChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const mark = getMark(container, 1); // series 0 ("antd"), point 1, value 20

    fireEvent.pointerEnter(mark);
    expect(getTagLines(container)).toEqual(["antd", "R1: 20"]);
    fireEvent.pointerLeave(mark);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();

    fireEvent.click(mark);
    fireEvent.pointerLeave(mark);
    expect(getTagLines(container)).toEqual(["antd", "R1: 20"]);
  });

  it("a dead click on empty chart space clears the persistent selection", () => {
    const { container } = render(<AreaChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const mark = getMark(container, 0);
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.click(mark);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).toBeInTheDocument();
    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });

  it("renders a trendline per series only when trendline is set", () => {
    const { container, rerender } = render(<AreaChart series={series} xLabels={xLabels} title="t" />);
    expect(container.querySelectorAll('[data-rebar-part="trendline"]')).toHaveLength(0);
    rerender(<AreaChart series={series} xLabels={xLabels} title="t" trendline />);
    expect(container.querySelectorAll('[data-rebar-part="trendline"]').length).toBeGreaterThan(0);
  });
});
