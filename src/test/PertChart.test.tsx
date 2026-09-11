import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PertChart } from "../components/PertChart";
import type { PertTask } from "../components/PertChart";

afterEach(cleanup);

// A textbook CPM example: A(3) -> B(4) -> D(2), A(3) -> C(2) -> D(2). Path through B is longer
// (3+4+2=9) than through C (3+2+2=7), so A/B/D are critical (0 slack) and C has 2 slack.
const TASKS: PertTask[] = [
  { id: "a", label: "Requirements", duration: 3 },
  { id: "b", label: "Design", duration: 4, dependsOn: ["a"] },
  { id: "c", label: "Prototype", duration: 2, dependsOn: ["a"] },
  { id: "d", label: "Launch", duration: 2, dependsOn: ["b", "c"] },
];

describe("PertChart", () => {
  it("renders a real svg with an accessible name from title", () => {
    render(<PertChart tasks={TASKS} title="Release plan" />);
    expect(screen.getByRole("img", { name: "Release plan" })).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<PertChart tasks={TASKS} title="Release plan" />);
    expect(container.querySelector('[data-rebar-component="pert-chart"]')).toBeInTheDocument();
  });

  it("computes earliest/latest start/finish correctly for a textbook two-path example", () => {
    render(<PertChart tasks={TASKS} title="Release plan" />);
    // A: ES 0, EF 3 (critical, on the longer A-B-D path)
    expect(screen.getByText("ES 0 · EF 3")).toBeInTheDocument();
    // B: ES 3, EF 7
    expect(screen.getByText("ES 3 · EF 7")).toBeInTheDocument();
    // C: ES 3, EF 5, but must wait for D's real start at 7 (slack 2)
    expect(screen.getByText("ES 3 · EF 5")).toBeInTheDocument();
    // D: ES 7 (max of B's EF=7, C's EF=5), EF 9
    expect(screen.getByText("ES 7 · EF 9")).toBeInTheDocument();
  });

  it("marks the longer path (A, B, D) critical and the shorter path (C) with real slack", () => {
    const { container } = render(<PertChart tasks={TASKS} title="Release plan" />);
    expect(container.querySelectorAll('[data-rebar-part="critical-node"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-rebar-part="node-box"]')).toHaveLength(1);
    expect(screen.getByText("Slack 2")).toBeInTheDocument();
    expect(screen.getAllByText("Critical · 0 slack")).toHaveLength(3);
  });

  it("a task with no dependencies still renders without crashing", () => {
    render(<PertChart tasks={[{ id: "solo", label: "Solo", duration: 5 }]} title="One task" />);
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("ES 0 · EF 5")).toBeInTheDocument();
  });

  it("a dangling dependsOn id is silently skipped, not thrown", () => {
    render(
      <PertChart
        tasks={[{ id: "a", label: "A", duration: 1, dependsOn: ["missing"] }]}
        title="Dangling dep"
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("ES 0 · EF 1")).toBeInTheDocument();
  });
});
