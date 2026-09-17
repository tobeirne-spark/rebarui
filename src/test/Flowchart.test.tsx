import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Flowchart } from "../components/Flowchart";
import type { FlowchartStep } from "../components/Flowchart";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-rebar-bionic");
});

function edgeLines(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-rebar-part="edge"] line'));
}

const steps: FlowchartStep[] = [
  { id: "start", label: "Start", shape: "start-end", next: ["check"] },
  { id: "check", label: "Valid?", shape: "decision", next: ["yes-path", "no-path"] },
  { id: "yes-path", label: "Process order", shape: "process", next: ["end"] },
  { id: "no-path", label: "Reject order", shape: "process", next: ["end"] },
  { id: "end", label: "End", shape: "start-end" },
];

describe("Flowchart", () => {
  it("carries data-rebar-component=flowchart and forwards data-testid", () => {
    render(<Flowchart steps={steps} data-testid="flow" />);
    expect(screen.getByTestId("flow")).toHaveAttribute("data-rebar-component", "flowchart");
  });

  it("a step with 2 entries in next produces 2 real edges", () => {
    const { container } = render(<Flowchart steps={steps} />);
    // "check" has next: ["yes-path", "no-path"] — both real targets.
    const checkNode = container.querySelector('[data-rebar-part="node"][data-node-id="check"]');
    const checkTransform = checkNode?.getAttribute("transform")?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
    const checkX = checkTransform ? parseFloat(checkTransform[1]!) : NaN;
    const checkY = checkTransform ? parseFloat(checkTransform[2]!) : NaN;

    const fromCheck = edgeLines(container).filter(
      (line) => Math.abs(parseFloat(line.getAttribute("x1")!) - checkX) < 0.5 && Math.abs(parseFloat(line.getAttribute("y1")!) - checkY) < 0.5,
    );
    expect(fromCheck).toHaveLength(2);
  });

  it("total edge count matches the sum of every step's own next list", () => {
    const { container } = render(<Flowchart steps={steps} />);
    // start->check, check->yes-path, check->no-path, yes-path->end, no-path->end = 5
    expect(edgeLines(container)).toHaveLength(5);
  });

  it("each shape value renders visually distinct SVG", () => {
    const { container } = render(<Flowchart steps={steps} />);
    expect(container.querySelectorAll('[data-rebar-part="node-shape-decision"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-rebar-part="node-shape-start-end"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-rebar-part="node-shape-process"]')).toHaveLength(2);

    // Decision renders as a <polygon>, process/start-end render as <rect> — genuinely different tags.
    const decisionEl = container.querySelector('[data-rebar-part="node-shape-decision"]');
    expect(decisionEl?.tagName.toLowerCase()).toBe("polygon");
    const processEl = container.querySelector('[data-rebar-part="node-shape-process"]');
    expect(processEl?.tagName.toLowerCase()).toBe("rect");

    // start-end's rx equals half its height (a full pill), process's rx is the small default (6) —
    // same tag, distinctly different rounding.
    const startEndEl = container.querySelector('[data-rebar-part="node-shape-start-end"]');
    expect(startEndEl?.getAttribute("rx")).not.toBe(processEl?.getAttribute("rx"));
  });

  it("a step that's the target of zero other steps' next still renders without crashing", () => {
    // "start" has no incoming next reference from any other step — it's a layout root.
    render(<Flowchart steps={steps} />);
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("no unrounded transcendental output reaches the decision polygon's points", () => {
    const { container } = render(<Flowchart steps={steps} />);
    const points = container.querySelector('[data-rebar-part="node-shape-decision"]')?.getAttribute("points") ?? "";
    // Every coordinate is a short, plain integer-ish literal derived from fixed half-width/height
    // constants — no long floating-point trig remainder.
    for (const token of points.split(/[\s,]+/).filter(Boolean)) {
      expect(/^-?\d+(\.\d{1,3})?$/.test(token)).toBe(true);
    }
  });

  it("splits each step's label for bionic reading via SVG tspan when ambient", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<Flowchart steps={steps} />);
    const fixations = container.querySelectorAll("tspan.rebar-bionic-fixation");
    expect(fixations.length).toBeGreaterThan(0);
    expect(fixations[0]?.tagName.toLowerCase()).toBe("tspan");
  });

  it("does not split step labels for bionic reading when not ambient", () => {
    const { container } = render(<Flowchart steps={steps} />);
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
  });

  it("also applies bionic reading to the figcaption title, previously not wired at all", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<Flowchart steps={steps} title="Order processing flow" />);
    const caption = container.querySelector("figcaption");
    expect(caption?.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
  });
});
