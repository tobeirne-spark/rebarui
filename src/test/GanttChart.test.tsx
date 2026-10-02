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

  it("draws a current-date marker when currentDate falls within the chart's own domain", () => {
    const { container } = render(
      <GanttChart tasks={tasks} title="Launch plan" currentDate={new Date("2026-01-15T00:00:00Z")} />,
    );
    expect(container.querySelector('[data-rebar-part="current-date-marker"]')).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("omits the current-date marker entirely when currentDate falls outside the domain", () => {
    const { container } = render(
      <GanttChart tasks={tasks} title="Launch plan" currentDate={new Date("2020-01-01T00:00:00Z")} />,
    );
    expect(container.querySelector('[data-rebar-part="current-date-marker"]')).not.toBeInTheDocument();
  });

  it("omits the current-date marker when currentDate isn't supplied at all", () => {
    const { container } = render(<GanttChart tasks={tasks} title="Launch plan" />);
    expect(container.querySelector('[data-rebar-part="current-date-marker"]')).not.toBeInTheDocument();
  });

  // Pagination (e.g. one PDF page per row-chunk of a long task list) renders each chunk as its own
  // GanttChart instance with only a subset of `tasks` -- domainStart/domainEnd let every instance
  // share one pixels-per-day scale instead of each computing a different, narrower domain from just
  // its own subset.
  it("uses an explicit domainStart/domainEnd instead of the computed min/max across tasks", () => {
    const { container } = render(
      <GanttChart
        tasks={tasks}
        title="Launch plan"
        domainStart={new Date("2025-12-01T00:00:00Z")}
        domainEnd={new Date("2026-03-01T00:00:00Z")}
      />,
    );
    // The first axis tick is the domain's own start, not the earliest task's start (2026-01-01).
    const firstTick = container.querySelector('text[data-rebar-part="tick-label"]');
    expect(firstTick?.textContent).toBe("Dec 1");
  });

  it("widens the plot's own left margin (and narrows the bar area) when labelWidth is set", () => {
    const { container: defaultMargin } = render(<GanttChart tasks={tasks} title="Default" />);
    const { container: wideMargin } = render(<GanttChart tasks={tasks} title="Wide" labelWidth={220} />);
    const defaultBar = defaultMargin.querySelector('rect[data-rebar-part="bar"][data-task-id="design"]');
    const wideBar = wideMargin.querySelector('rect[data-rebar-part="bar"][data-task-id="design"]');
    expect(Number(wideBar?.getAttribute("x"))).toBeGreaterThan(Number(defaultBar?.getAttribute("x")));
  });

  it("positions a same-dated task's bar identically whether or not sibling tasks share the render", () => {
    const widerDomain = { domainStart: new Date("2025-12-01T00:00:00Z"), domainEnd: new Date("2026-03-01T00:00:00Z") };
    const { container: full } = render(<GanttChart tasks={tasks} title="Full" {...widerDomain} />);
    const { container: solo } = render(<GanttChart tasks={tasks.slice(0, 1)} title="Solo" {...widerDomain} />);
    const fullBar = full.querySelector('rect[data-rebar-part="bar"][data-task-id="design"]');
    const soloBar = solo.querySelector('rect[data-rebar-part="bar"][data-task-id="design"]');
    expect(soloBar?.getAttribute("x")).toBe(fullBar?.getAttribute("x"));
    expect(soloBar?.getAttribute("width")).toBe(fullBar?.getAttribute("width"));
  });
});
