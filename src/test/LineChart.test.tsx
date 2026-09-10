import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LineChart } from "../components/LineChart";

function getMark(container: HTMLElement, index: number) {
  return container.querySelectorAll('[data-rebar-part="mark"]')[index] as HTMLElement;
}

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

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

  it("shows no value tag until a mark is hovered or selected", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });

  it("hovering a mark shows its value tag, unhovering hides it again", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const mark = getMark(container, 0); // series 0 ("antd"), point 0, value 10

    fireEvent.pointerEnter(mark);
    expect(getTagLines(container)).toEqual(["antd", "R0: 10"]);

    fireEvent.pointerLeave(mark);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });

  it("clicking a mark persists its tag after the pointer leaves", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const mark = getMark(container, 1); // series 0, point 1, value 20

    fireEvent.pointerEnter(mark);
    fireEvent.click(mark);
    fireEvent.pointerLeave(mark);

    expect(getTagLines(container)).toEqual(["antd", "R1: 20"]);
  });

  it("clicking a different mark swaps which tag persists", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const firstMark = getMark(container, 0);
    const secondMark = getMark(container, 3); // series 1 ("rebar-ui"), point 0, value 8

    fireEvent.click(firstMark);
    expect(getTagLines(container)).toEqual(["antd", "R0: 10"]);

    fireEvent.click(secondMark);
    expect(getTagLines(container)).toEqual(["rebar-ui", "R0: 8"]);
  });

  it("a dead click on empty chart space clears the persistent selection", () => {
    const { container } = render(<LineChart series={series} xLabels={xLabels} title="Cumulative cost" />);
    const mark = getMark(container, 0);
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.click(mark);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).toBeInTheDocument();

    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });
});
