import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OrgChart } from "../components/OrgChart";
import type { OrgChartPerson } from "../components/OrgChart";

afterEach(cleanup);

function parseTransform(transform: string | null) {
  const translate = transform?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  return {
    x: translate ? parseFloat(translate[1]!) : undefined,
    y: translate ? parseFloat(translate[2]!) : undefined,
  };
}

function getNodeTransform(container: HTMLElement, id: string) {
  const el = container.querySelector(`[data-rebar-part="node"][data-node-id="${id}"]`);
  return parseTransform(el?.getAttribute("transform") ?? null);
}

function edgeLines(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-rebar-part="edge"] line'));
}

const people: OrgChartPerson[] = [
  { id: "ceo", name: "Ada Root", role: "CEO" },
  { id: "vp-eng", name: "Grace Hopper", role: "VP Engineering", parentId: "ceo" },
  { id: "vp-sales", name: "Sam Sales", role: "VP Sales", parentId: "ceo" },
];

describe("OrgChart", () => {
  it("carries data-rebar-component=org-chart and forwards data-testid", () => {
    render(<OrgChart people={people} data-testid="chart" />);
    const el = screen.getByTestId("chart");
    expect(el).toHaveAttribute("data-rebar-component", "org-chart");
  });

  it("a person with parentId pointing at a real other person produces a real edge between them", () => {
    const { container } = render(<OrgChart people={people} />);
    const ceo = getNodeTransform(container, "ceo");
    const vpEng = getNodeTransform(container, "vp-eng");

    const lines = edgeLines(container);
    const match = lines.find(
      (line) =>
        Math.abs(parseFloat(line.getAttribute("x1")!) - (ceo.x ?? NaN)) < 0.5 &&
        Math.abs(parseFloat(line.getAttribute("y1")!) - (ceo.y ?? NaN)) < 0.5 &&
        Math.abs(parseFloat(line.getAttribute("x2")!) - (vpEng.x ?? NaN)) < 0.5 &&
        Math.abs(parseFloat(line.getAttribute("y2")!) - (vpEng.y ?? NaN)) < 0.5,
    );
    expect(match).toBeDefined();
  });

  it("produces exactly one edge per non-root person", () => {
    const { container } = render(<OrgChart people={people} />);
    // 2 non-root people (vp-eng, vp-sales), each with one parent edge.
    expect(edgeLines(container)).toHaveLength(2);
  });

  it("a root person (no parentId) has no incoming edge", () => {
    const { container } = render(<OrgChart people={people} />);
    const ceo = getNodeTransform(container, "ceo");
    const lines = edgeLines(container);
    // No edge's target endpoint (x2,y2) lands on the root's own position.
    const incoming = lines.find(
      (line) =>
        Math.abs(parseFloat(line.getAttribute("x2")!) - (ceo.x ?? NaN)) < 0.5 &&
        Math.abs(parseFloat(line.getAttribute("y2")!) - (ceo.y ?? NaN)) < 0.5,
    );
    expect(incoming).toBeUndefined();
  });

  it("renders each person's name and role as separate text lines", () => {
    render(<OrgChart people={people} />);
    expect(screen.getByText("Ada Root")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("VP Engineering")).toBeInTheDocument();
  });

  it("renders a visible figcaption from title, distinct from any person's own role", () => {
    render(<OrgChart people={people} title="Acme org chart" />);
    expect(screen.getByText("Acme org chart")).toBeInTheDocument();
  });
});
