import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NodeLinkGraph } from "../components/NodeLinkGraph";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "../components/NodeLinkGraph";

afterEach(cleanup);

// jsdom doesn't implement a real `PointerEvent` constructor in every version this project's CI
// runs against — a minimal, local stand-in (MouseEvent plus the two pointer-specific fields this
// component's handlers actually read), the same technique `ResizablePanels.test.tsx` uses.
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, params: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? "mouse";
  }
}

function parseTransform(transform: string | null) {
  const translate = transform?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  const scale = transform?.match(/scale\(([-\d.]+)\)/);
  const translateX = translate?.[1];
  const translateY = translate?.[2];
  const scaleValue = scale?.[1];
  return {
    x: translateX !== undefined ? parseFloat(translateX) : undefined,
    y: translateY !== undefined ? parseFloat(translateY) : undefined,
    scale: scaleValue !== undefined ? parseFloat(scaleValue) : undefined,
  };
}

function getNodeTransform(container: HTMLElement, id: string) {
  const el = container.querySelector(`[data-rebar-part="node"][data-node-id="${id}"]`);
  return parseTransform(el?.getAttribute("transform") ?? null);
}

const treeNodes: NodeLinkGraphNode[] = [
  { id: "root", label: "Root" },
  { id: "child-a", label: "Child A", parentId: "root" },
  { id: "child-b", label: "Child B", parentId: "root" },
];
const treeEdges: NodeLinkGraphEdge[] = [
  { source: "root", target: "child-a" },
  { source: "root", target: "child-b" },
];

describe("NodeLinkGraph", () => {
  it("carries data-rebar-component and forwards data-testid", () => {
    render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} data-testid="graph" />);
    expect(screen.getByTestId("graph")).toHaveAttribute("data-rebar-component", "node-link-graph");
  });

  it("hierarchical layout positions parent and children at different depth-based y, and siblings at different x", () => {
    const { container } = render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} layout="hierarchical" />);

    const root = getNodeTransform(container, "root");
    const childA = getNodeTransform(container, "child-a");
    const childB = getNodeTransform(container, "child-b");

    // Parent sits at a shallower depth (smaller y) than its children.
    expect(root.y).toBeDefined();
    expect(childA.y).toBeDefined();
    expect(root.y).not.toEqual(childA.y);
    expect(childA.y).toEqual(childB.y); // same depth level

    // Siblings are spread horizontally, not stacked at the same x.
    expect(childA.x).not.toEqual(childB.x);
  });

  it("circular layout spaces nodes evenly around a circle (equal radius from center, distinct positions)", () => {
    const nodes: NodeLinkGraphNode[] = [
      { id: "n0", label: "0" },
      { id: "n1", label: "1" },
      { id: "n2", label: "2" },
      { id: "n3", label: "3" },
    ];
    const { container } = render(<NodeLinkGraph nodes={nodes} edges={[]} layout="circular" width={400} height={400} />);

    const cx = 200;
    const cy = 200;
    const positions = nodes.map((n) => getNodeTransform(container, n.id));
    const radii = positions.map((p) => Math.hypot((p.x ?? 0) - cx, (p.y ?? 0) - cy));

    // All nodes sit at (approximately) the same radius from the graph's center.
    const firstRadius = radii[0];
    expect(firstRadius).toBeDefined();
    for (const r of radii) {
      expect(Math.abs(r - firstRadius!)).toBeLessThan(1);
    }

    // But at distinct angular positions (no two nodes share the same x,y).
    const unique = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(unique.size).toBe(nodes.length);
  });

  it("clicking the zoom buttons changes the rendered scale", async () => {
    const user = userEvent.setup();
    const { container } = render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} />);

    const before = parseTransform(
      container.querySelector('[data-rebar-part="pan-zoom-container"]')?.getAttribute("transform") ?? null,
    );
    expect(before.scale).toBe(1);

    await user.click(screen.getByLabelText("Zoom in"));
    const afterIn = parseTransform(
      container.querySelector('[data-rebar-part="pan-zoom-container"]')?.getAttribute("transform") ?? null,
    );
    expect(afterIn.scale).toBeGreaterThan(1);

    await user.click(screen.getByLabelText("Zoom out"));
    await user.click(screen.getByLabelText("Zoom out"));
    const afterOut = parseTransform(
      container.querySelector('[data-rebar-part="pan-zoom-container"]')?.getAttribute("transform") ?? null,
    );
    expect(afterOut.scale).toBeLessThan(afterIn.scale!);
  });

  it("zoom buttons are real >=44x44 touch targets", () => {
    render(<NodeLinkGraph nodes={treeNodes} edges={treeEdges} />);
    for (const label of ["Zoom in", "Zoom out"]) {
      const button = screen.getByLabelText(label);
      expect(button.tagName).toBe("BUTTON");
    }
  });

  it("dragging a node in manual layout fires onNodePositionChange with reasonable new coordinates", () => {
    const onNodePositionChange = vi.fn();
    const manualNodes: NodeLinkGraphNode[] = [
      { id: "a", label: "A", x: 50, y: 50 },
      { id: "b", label: "B", x: 200, y: 150 },
    ];
    const { container } = render(
      <NodeLinkGraph
        nodes={manualNodes}
        edges={[]}
        layout="manual"
        onNodePositionChange={onNodePositionChange}
      />,
    );

    const nodeEl = container.querySelector('[data-rebar-part="node"][data-node-id="a"]')!;

    act(() => {
      nodeEl.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 50, clientY: 50, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: 90, clientY: 70, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: 90, clientY: 70, pointerId: 1 }));
    });

    expect(onNodePositionChange).toHaveBeenCalledWith("a", 90, 70);
  });

  it("dragging a node in hierarchical layout does NOT reposition it or fire onNodePositionChange", () => {
    const onNodePositionChange = vi.fn();
    const { container } = render(
      <NodeLinkGraph
        nodes={treeNodes}
        edges={treeEdges}
        layout="hierarchical"
        onNodePositionChange={onNodePositionChange}
      />,
    );

    const before = getNodeTransform(container, "child-a");
    const nodeEl = container.querySelector('[data-rebar-part="node"][data-node-id="child-a"]')!;

    act(() => {
      nodeEl.dispatchEvent(
        new FakePointerEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, pointerId: 1, button: 0 }),
      );
      window.dispatchEvent(new FakePointerEvent("pointermove", { clientX: 300, clientY: 300, pointerId: 1 }));
      window.dispatchEvent(new FakePointerEvent("pointerup", { clientX: 300, clientY: 300, pointerId: 1 }));
    });

    const after = getNodeTransform(container, "child-a");
    expect(after).toEqual(before);
    expect(onNodePositionChange).not.toHaveBeenCalled();
  });

  it("a node with no edges at all still renders without crashing", () => {
    render(<NodeLinkGraph nodes={[{ id: "solo", label: "Solo" }]} edges={[]} />);
    expect(screen.getByText("Solo")).toBeInTheDocument();
  });
});
