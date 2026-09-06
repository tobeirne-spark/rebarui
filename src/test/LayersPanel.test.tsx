import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayersPanel } from "../components/LayersPanel";
import type { LayerNode } from "../components/LayersPanel";

afterEach(cleanup);

const LAYERS: LayerNode[] = [
  {
    id: "group-1",
    name: "Group 1",
    children: [
      { id: "layer-a", name: "Layer A" },
      { id: "layer-b", name: "Layer B", locked: true },
    ],
  },
  { id: "layer-c", name: "Layer C", hidden: true },
];

// jsdom reports an all-zero rect for every element (a known limitation, the same one
// `ResizablePanels`' own drag test works around) — mock a real one so the row's drop-position
// math (top/middle/bottom third) has real numbers to divide by.
// jsdom's `DragEvent` doesn't carry `clientX`/`clientY` through the way a real browser's does —
// `fireEvent.dragEnter(el, { clientY })` silently drops it, leaving `event.clientY` `undefined`
// (matching the `PointerEvent` gap `ResizablePanels`' own drag test already works around the same
// way: construct the real event and assign the coordinate as an own property afterward, which
// shadows whatever jsdom's incomplete prototype getter would otherwise return).
function fireDragEventWithClientY(el: Element, type: "dragenter" | "dragover" | "drop", clientY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, "clientY", { value: clientY, configurable: true });
  Object.defineProperty(event, "dataTransfer", { value: null, configurable: true });
  fireEvent(el, event);
}

function mockRowRect(row: Element, top: number, height: number) {
  vi.spyOn(row, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top,
    right: 300,
    bottom: top + height,
    width: 300,
    height,
    x: 0,
    y: top,
    toJSON: () => {},
  });
}

describe("LayersPanel", () => {
  it("renders nested groups with only top-level nodes' children collapsed, at the correct indent", () => {
    render(<LayersPanel layers={LAYERS} aria-label="Layers" />);
    const group = screen.getByRole("treeitem", { name: /Group 1/ });
    const layerC = screen.getByRole("treeitem", { name: /Layer C/ });
    expect(group).toHaveAttribute("aria-level", "1");
    expect(layerC).toHaveAttribute("aria-level", "1");
    expect(group).toHaveStyle({ paddingInlineStart: "0px" });
    // Children start collapsed by default (no defaultExpanded passed).
    expect(screen.queryByRole("treeitem", { name: /Layer A/ })).not.toBeInTheDocument();
  });

  it("expands a group to reveal its children, indented one level deeper, and collapses again", async () => {
    const user = userEvent.setup();
    render(<LayersPanel layers={LAYERS} aria-label="Layers" />);
    await user.click(screen.getByRole("button", { name: "Expand Group 1" }));

    const layerA = screen.getByRole("treeitem", { name: /Layer A/ });
    expect(layerA).toBeInTheDocument();
    expect(layerA).toHaveAttribute("aria-level", "2");
    expect(layerA).toHaveStyle({ paddingInlineStart: "20px" });
    expect(screen.getByRole("treeitem", { name: /Group 1/ })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Collapse Group 1" }));
    expect(screen.queryByRole("treeitem", { name: /Layer A/ })).not.toBeInTheDocument();
  });

  it("disables the expand toggle for a group with no children yet", () => {
    const withEmptyGroup: LayerNode[] = [{ id: "empty-group", name: "Empty group", children: [] }];
    render(<LayersPanel layers={withEmptyGroup} aria-label="Layers" />);
    expect(screen.getByRole("button", { name: "Expand Empty group" })).toBeDisabled();
  });

  it("renames a layer via the real Editable component, committing back through onRename", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    function Wrapper() {
      const [layers, setLayers] = useState(LAYERS);
      return (
        <LayersPanel
          layers={layers}
          aria-label="Layers"
          onRename={(id, name) => {
            onRename(id, name);
            setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
          }}
        />
      );
    }
    render(<Wrapper />);

    const display = screen.getByRole("button", { name: "Layer C, click to edit" });
    await user.click(display);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Renamed layer{Enter}");

    expect(onRename).toHaveBeenLastCalledWith("layer-c", "Renamed layer");
    expect(screen.getByRole("button", { name: "Renamed layer, click to edit" })).toBeInTheDocument();
  });

  it("fires onToggleLocked and onToggleHidden with the flipped value", async () => {
    const user = userEvent.setup();
    const onToggleLocked = vi.fn();
    const onToggleHidden = vi.fn();
    render(
      <LayersPanel
        layers={LAYERS}
        aria-label="Layers"
        onToggleLocked={onToggleLocked}
        onToggleHidden={onToggleHidden}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Lock Layer C" }));
    expect(onToggleLocked).toHaveBeenCalledWith("layer-c", true);

    await user.click(screen.getByRole("button", { name: "Show Layer C" }));
    expect(onToggleHidden).toHaveBeenCalledWith("layer-c", false);
  });

  it("expands and shows the active-border beam on a valid drag-over row, clearing on drag-leave", () => {
    render(<LayersPanel layers={LAYERS} aria-label="Layers" />);
    const dragged = screen.getByRole("treeitem", { name: /Layer C/ });
    const group = screen.getByRole("treeitem", { name: /Group 1/ });
    mockRowRect(group, 0, 40);

    fireEvent.dragStart(dragged);
    fireEvent.dragEnter(group, { clientY: 20 });
    expect(group).toHaveClass("rebar-active-border");

    fireEvent.dragLeave(group, { relatedTarget: document.body });
    expect(group).not.toHaveClass("rebar-active-border");
  });

  it("fires onReorder with 'before'/'after' when dropped on the top/bottom edge of a row", () => {
    const onReorder = vi.fn();
    render(<LayersPanel layers={LAYERS} aria-label="Layers" onReorder={onReorder} />);
    const dragged = screen.getByRole("treeitem", { name: /Layer C/ });
    const group = screen.getByRole("treeitem", { name: /Group 1/ });
    mockRowRect(group, 0, 40);

    fireEvent.dragStart(dragged);
    fireDragEventWithClientY(group, "dragenter", 2); // near the top edge -> "before"
    fireDragEventWithClientY(group, "drop", 2);

    expect(onReorder).toHaveBeenCalledWith("layer-c", "group-1", "before");
  });

  it("fires onReorder with 'inside' when dropped in the middle of a group row", () => {
    const onReorder = vi.fn();
    render(<LayersPanel layers={LAYERS} aria-label="Layers" onReorder={onReorder} />);
    const dragged = screen.getByRole("treeitem", { name: /Layer C/ });
    const group = screen.getByRole("treeitem", { name: /Group 1/ });
    mockRowRect(group, 0, 40);

    fireEvent.dragStart(dragged);
    fireDragEventWithClientY(group, "dragenter", 20); // dead center -> "inside"
    fireDragEventWithClientY(group, "drop", 20);

    expect(onReorder).toHaveBeenCalledWith("layer-c", "group-1", "inside");
  });

  it("moves a layer via the keyboard-only Move up/down fallback, with no drag event at all", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<LayersPanel layers={LAYERS} aria-label="Layers" onReorder={onReorder} />);

    const moveUpButton = screen.getByRole("button", { name: "Move Layer C up" });
    moveUpButton.focus();
    expect(moveUpButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onReorder).toHaveBeenCalledWith("layer-c", "group-1", "before");
  });

  it("disables Move up for the first sibling and Move down for the last sibling", () => {
    render(<LayersPanel layers={LAYERS} aria-label="Layers" />);
    expect(screen.getByRole("button", { name: "Move Group 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Layer C down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Group 1 down" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Layer C up" })).not.toBeDisabled();
  });

  it("selects a layer on row click, uncontrolled by default", async () => {
    const user = userEvent.setup();
    const onSelectedIdChange = vi.fn();
    render(<LayersPanel layers={LAYERS} aria-label="Layers" onSelectedIdChange={onSelectedIdChange} />);
    await user.click(screen.getByRole("treeitem", { name: /Layer C/ }));
    expect(onSelectedIdChange).toHaveBeenCalledWith("layer-c");
    expect(screen.getByRole("treeitem", { name: /Layer C/ })).toHaveAttribute("aria-selected", "true");
  });

  it("renders the shared Empty component when layers is empty", () => {
    render(<LayersPanel layers={[]} aria-label="Layers" />);
    expect(screen.getByText("No layers")).toBeInTheDocument();
    expect(screen.queryByRole("tree")).not.toBeInTheDocument();
  });
});
