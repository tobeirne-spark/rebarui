import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GanttChart } from "../components/GanttChart";

afterEach(cleanup);

describe("GanttChart", () => {
  const tasks = [
    { id: "design", label: "Design", start: new Date("2026-01-01T00:00:00Z"), end: new Date("2026-01-10T00:00:00Z") },
    {
      id: "build",
      label: "Build",
      start: new Date("2026-01-10T00:00:00Z"),
      end: new Date("2026-01-24T00:00:00Z"),
      progress: 0.5,
      dependsOn: ["design"],
    },
    {
      id: "test",
      label: "Test",
      start: new Date("2026-01-24T00:00:00Z"),
      end: new Date("2026-01-30T00:00:00Z"),
      dependsOn: ["build"],
    },
  ];

  it("renders a real svg with an accessible name from title when ariaLabel is omitted", () => {
    render(<GanttChart tasks={tasks} title="Launch plan" />);
    expect(screen.getByRole("img", { name: "Launch plan" })).toBeInTheDocument();
  });

  it("prefers an explicit ariaLabel over title for the accessible name", () => {
    render(<GanttChart tasks={tasks} title="Launch plan" ariaLabel="Detailed description" />);
    expect(screen.getByRole("img", { name: "Detailed description" })).toBeInTheDocument();
  });

  it("renders a visible figcaption when title is set, and omits it when title is unset", () => {
    const { rerender } = render(<GanttChart tasks={tasks} title="Launch plan" />);
    expect(screen.getByText("Launch plan")).toBeInTheDocument();
    rerender(<GanttChart tasks={tasks} ariaLabel="Launch plan chart" />);
    expect(screen.queryByText("Launch plan")).not.toBeInTheDocument();
  });

  it("renders one bar per task and each task's own label", () => {
    render(<GanttChart tasks={tasks} title="Launch plan" />);
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<GanttChart tasks={tasks} title="Launch plan" />);
    expect(container.querySelector('[data-rebar-component="gantt-chart"]')).toBeInTheDocument();
  });

  it("renders one bar rect per task", () => {
    const { container } = render(<GanttChart tasks={tasks} title="Launch plan" />);
    expect(container.querySelectorAll('rect[data-rebar-part="bar"]')).toHaveLength(tasks.length);
  });

  it("renders a progress task's partial fill sized relative to its own bar width", () => {
    const { container } = render(<GanttChart tasks={tasks} title="Launch plan" />);
    const bar = container.querySelector('rect[data-rebar-part="bar"][data-task-id="build"]');
    const fill = container.querySelector('rect[data-rebar-part="progress-fill"][data-task-id="build"]');
    expect(bar).toBeInTheDocument();
    expect(fill).toBeInTheDocument();
    const barWidth = Number(bar?.getAttribute("width"));
    const fillWidth = Number(fill?.getAttribute("width"));
    expect(barWidth).toBeGreaterThan(0);
    // progress: 0.5 -> the fill should be half the bar's own width.
    expect(fillWidth).toBeCloseTo(barWidth * 0.5, 5);
    // A task without an explicit `progress` renders no partial-fill element at all.
    expect(container.querySelector('rect[data-rebar-part="progress-fill"][data-task-id="design"]')).not.toBeInTheDocument();
  });

  it("renders a connecting dependency line for a task whose dependsOn points at a real other task", () => {
    const { container } = render(<GanttChart tasks={tasks} title="Launch plan" />);
    const lines = container.querySelectorAll('polyline[data-rebar-part="dependency-line"]');
    // design -> build, build -> test: two real dependency edges.
    expect(lines).toHaveLength(2);
    const buildLine = container.querySelector('polyline[data-rebar-part="dependency-line"][data-from="design"][data-to="build"]');
    expect(buildLine).toBeInTheDocument();
  });

  it("skips a dependsOn entry that points at a non-existent task id instead of throwing", () => {
    const withDanglingDep = [
      ...tasks.slice(0, 2),
      { ...tasks[2], dependsOn: ["does-not-exist"] } as (typeof tasks)[number],
    ];
    expect(() => render(<GanttChart tasks={withDanglingDep} title="Launch plan" />)).not.toThrow();
  });
});
