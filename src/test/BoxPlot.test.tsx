import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BoxPlot } from "../components/BoxPlot";

function getHitArea(container: HTMLElement, index: number) {
  return container.querySelectorAll('[data-rebar-part="box-plot-hit-area"]')[index] as HTMLElement;
}

function getTagLines(container: HTMLElement) {
  const tag = container.querySelector('[data-rebar-part="value-tag"]');
  return Array.from(tag?.querySelectorAll("text") ?? []).map((el) => el.textContent);
}

afterEach(cleanup);

describe("BoxPlot", () => {
  const groups = [
    { label: "Control", min: 10, q1: 20, median: 28, q3: 35, max: 50 },
    { label: "Treatment", min: 15, q1: 30, median: 40, q3: 48, max: 60 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<BoxPlot groups={groups} title="Response time" />);
    expect(screen.getByRole("img", { name: "Response time" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<BoxPlot groups={groups} title="Response time" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<BoxPlot groups={groups} title="Response time" />);
    expect(screen.getByText("Response time")).toBeInTheDocument();
    rerender(<BoxPlot groups={groups} ariaLabel="Response time chart" />);
    expect(screen.queryByText("Response time")).not.toBeInTheDocument();
  });

  it("renders one whisker, one box, and one median line per group, plus its label", () => {
    const { container } = render(<BoxPlot groups={groups} title="Response time" />);
    expect(container.querySelectorAll('[data-rebar-part="box-plot-group"]')).toHaveLength(groups.length);
    expect(container.querySelectorAll('[data-rebar-part="box-plot-whisker"]')).toHaveLength(groups.length);
    expect(container.querySelectorAll('[data-rebar-part="box-plot-box"]')).toHaveLength(groups.length);
    expect(container.querySelectorAll('[data-rebar-part="box-plot-median"]')).toHaveLength(groups.length);
    expect(screen.getByText("Control")).toBeInTheDocument();
    expect(screen.getByText("Treatment")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<BoxPlot groups={groups} title="Response time" />);
    expect(container.querySelector('[data-rebar-component="box-plot"]')).toBeInTheDocument();
  });

  it("handles a zero-spread group (min=q1=median=q3=max) without collapsing element counts", () => {
    const flatGroups = [
      ...groups,
      { label: "Constant", min: 25, q1: 25, median: 25, q3: 25, max: 25 },
    ];
    const { container } = render(<BoxPlot groups={flatGroups} title="With a flat group" />);
    const boxGroups = container.querySelectorAll('[data-rebar-part="box-plot-group"]');
    expect(boxGroups).toHaveLength(3);
    const constantBox = container.querySelectorAll('[data-rebar-part="box-plot-box"]')[2];
    expect(constantBox).toBeInTheDocument();
    // Zero interquartile spread collapses to a zero-height box, not a crash or a negative height.
    expect(constantBox).toHaveAttribute("height", "0");
    expect(screen.getByText("Constant")).toBeInTheDocument();
  });

  it("already draws min-max whiskers per group (a real line, not just the box)", () => {
    const { container } = render(<BoxPlot groups={groups} title="Response time" />);
    const whisker = container.querySelector('[data-rebar-part="box-plot-whisker"]');
    expect(whisker?.tagName.toLowerCase()).toBe("line");
  });

  it("hovering a group's band shows its statistical summary tag; clicking persists it", () => {
    const { container } = render(<BoxPlot groups={groups} title="Response time" />);
    const hitArea = getHitArea(container, 0); // "Control"

    fireEvent.pointerEnter(hitArea);
    expect(getTagLines(container)).toEqual([
      "Control (statistical summary)",
      "Max: 50   Q3: 35",
      "Median: 28",
      "Q1: 20   Min: 10",
    ]);
    fireEvent.pointerLeave(hitArea);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();

    fireEvent.click(hitArea);
    fireEvent.pointerLeave(hitArea);
    expect(getTagLines(container)[0]).toBe("Control (statistical summary)");
  });

  it("clicking a different group's band swaps which summary persists", () => {
    const { container } = render(<BoxPlot groups={groups} title="Response time" />);
    fireEvent.click(getHitArea(container, 0));
    expect(getTagLines(container)[0]).toBe("Control (statistical summary)");

    fireEvent.click(getHitArea(container, 1));
    expect(getTagLines(container)[0]).toBe("Treatment (statistical summary)");
  });

  it("a dead click on empty chart space clears the persistent selection", () => {
    const { container } = render(<BoxPlot groups={groups} title="Response time" />);
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.click(getHitArea(container, 0));
    expect(container.querySelector('[data-rebar-part="value-tag"]')).toBeInTheDocument();
    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });
});
