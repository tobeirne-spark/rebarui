import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { HeatmapPainter } from "../components/HeatmapPainter";
import type { HeatmapPainterProps } from "../components/HeatmapPainter";
import type { HeatmapLayout } from "../components/heatmapGeometry";

const LAYOUT: HeatmapLayout = {
  cellSize: 10,
  brushes: [
    { id: "zone", label: "Zone", color: "#1677ff" },
    { id: "bldg", label: "Building", color: "#cf1322", showLabel: false },
  ],
  frames: [{ id: "frame-1", title: "Frame 1", crop: [0, 0, 100, 100] }],
  regions: [
    { id: "r1", kind: "zone", label: "Region One", rects: [[0, 0, 20, 10]], memberIds: ["m1", "m2"] },
    { id: "r2", kind: "bldg", label: "Region Two", rects: [[50, 50, 70, 70]] },
  ],
};

// A fixed camera (1 screen px = 1 world unit, origin at the top-left) so synthetic pointer events
// land on predictable cells. jsdom has no real PointerEvent, so gestures are dispatched as
// MouseEvents typed "pointerdown"/"pointermove"/"pointerup" — React maps them onto its pointer
// handlers and clientX/clientY survive. jsdom also has no canvas (getContext -> null), which the
// component must tolerate; what these tests can observe is the *state* the gestures produce.
const CAMERA = { x: 0, y: 0, zoom: 1 };

// jsdom logs a "not implemented" error (and returns null) for getContext; stub it to stay quiet.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

function renderPainter(props: Partial<HeatmapPainterProps> = {}) {
  return render(<HeatmapPainter defaultValue={LAYOUT} defaultCamera={CAMERA} {...props} />);
}

const canvas = (container: HTMLElement) => container.querySelector("canvas") as HTMLCanvasElement;

function pointer(el: Element, type: "pointerdown" | "pointermove" | "pointerup", x: number, y: number, init: MouseEventInit = {}) {
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...init }));
  });
}

function drag(el: Element, from: [number, number], to: [number, number], init: MouseEventInit = {}) {
  pointer(el, "pointerdown", from[0], from[1], init);
  pointer(el, "pointermove", to[0], to[1], init);
  pointer(el, "pointerup", to[0], to[1], init);
}

const lastLayout = (fn: ReturnType<typeof vi.fn>): HeatmapLayout => fn.mock.calls[fn.mock.calls.length - 1]![0];

describe("HeatmapPainter — structure and ARIA", () => {
  it("carries data-rebar-component, a state reflecting the tool, and named parts", () => {
    const { container } = renderPainter();
    const root = container.querySelector('[data-rebar-component="heatmap-painter"]')!;
    expect(root).toHaveAttribute("data-rebar-state", "paint");
    for (const part of ["stage", "canvas", "tools", "zoom", "panel", "toolbar", "cell-form", "frames-section", "brushes-section", "regions-section"]) {
      expect(container.querySelector(`[data-rebar-part="${part}"]`), part).not.toBeNull();
    }
  });

  it("forwards data-*/aria-*/className/style and applies height", () => {
    const { container } = renderPainter({ className: "x", height: 400, "data-testid": "p", style: { opacity: 0.9 } } as never);
    const root = container.querySelector('[data-rebar-component="heatmap-painter"]') as HTMLElement;
    expect(root).toHaveClass("rebar-heatmap-painter", "x");
    expect(root).toHaveAttribute("data-testid", "p");
    expect(root.style.height).toBe("400px");
    expect(root.style.opacity).toBe("0.9");
  });

  it("gives the canvas an accessible name (overridable) and makes it focusable", () => {
    const { container, rerender } = renderPainter();
    expect(screen.getByRole("application", { name: "Heatmap painting canvas" })).toBe(canvas(container));
    expect(canvas(container)).toHaveAttribute("tabindex", "0");
    rerender(<HeatmapPainter defaultValue={LAYOUT} defaultCamera={CAMERA} canvasLabel="Floor plan" />);
    expect(screen.getByRole("application", { name: "Floor plan" })).toBeInTheDocument();
  });

  it("does not throw when canvas 2D context is unavailable (jsdom)", () => {
    expect(() => renderPainter()).not.toThrow();
    expect(canvas(document.body).getContext("2d")).toBeNull();
  });

  it("renders with no value at all (empty uncontrolled layout)", () => {
    render(<HeatmapPainter />);
    expect(screen.getByRole("button", { name: /create region/i })).toBeDisabled();
    expect(screen.getByText("Regions (0)")).toBeInTheDocument();
  });

  it("lists regions, brushes and frames with counts", () => {
    renderPainter();
    expect(screen.getByText("Regions (2)")).toBeInTheDocument();
    expect(screen.getByText("Brushes (2)")).toBeInTheDocument();
    expect(screen.getByText("Frames (1)")).toBeInTheDocument();
  });
});

describe("HeatmapPainter — tools and camera controls", () => {
  it("switches between paint and frame tools via pressed toggle buttons", async () => {
    const user = userEvent.setup();
    const { container } = renderPainter();
    const paint = screen.getByRole("button", { name: "Paint" });
    const frame = screen.getByRole("button", { name: "Frame" });
    expect(paint).toHaveAttribute("aria-pressed", "true");
    expect(frame).toHaveAttribute("aria-pressed", "false");
    await user.click(frame);
    expect(frame).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector('[data-rebar-component="heatmap-painter"]')).toHaveAttribute("data-rebar-state", "frame");
  });

  it("zoom buttons change the readout; Fit performs a content fit", async () => {
    const user = userEvent.setup();
    const { container } = renderPainter();
    const readout = container.querySelector('[data-rebar-part="zoom-readout"]')!;
    expect(readout).toHaveTextContent("100%");
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(readout).toHaveTextContent("140%");
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(readout).toHaveTextContent("71%");
    await user.click(screen.getByRole("button", { name: "Fit" }));
    // Content is 100 units square in an 800 x 560 viewport with 48px padding: (560 - 96) / 100.
    expect(readout).toHaveTextContent("464%");
  });

  it("the focused canvas takes + / - / 0 and arrow keys", async () => {
    const user = userEvent.setup();
    const { container } = renderPainter();
    const readout = container.querySelector('[data-rebar-part="zoom-readout"]')!;
    canvas(container).focus();
    await user.keyboard("+");
    expect(readout).toHaveTextContent("140%");
    await user.keyboard("-");
    expect(readout).toHaveTextContent("100%");
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(readout).toHaveTextContent("100%");
    await user.keyboard("0");
    expect(readout).toHaveTextContent("464%");
  });

  it("Ctrl+wheel zooms; plain wheel pans without changing zoom", () => {
    const { container } = renderPainter();
    const readout = container.querySelector('[data-rebar-part="zoom-readout"]')!;
    fireEvent.wheel(canvas(container), { deltaY: -100, ctrlKey: true });
    expect(readout).not.toHaveTextContent("100%");
    const zoomed = readout.textContent;
    fireEvent.wheel(canvas(container), { deltaY: 40 });
    expect(readout.textContent).toBe(zoomed);
  });
});

describe("HeatmapPainter — painting cells and creating regions", () => {
  it("a click paints the cell under the pointer; clicking it again erases", () => {
    const { container } = renderPainter();
    const c = canvas(container);
    expect(screen.getByRole("button", { name: /clear painted \(0\)/i })).toBeDisabled();
    pointer(c, "pointerdown", 105, 105);
    pointer(c, "pointerup", 105, 105);
    expect(screen.getByRole("button", { name: /clear painted \(1\)/i })).toBeEnabled();
    pointer(c, "pointerdown", 108, 102); // same 10-unit cell -> erase mode
    pointer(c, "pointerup", 108, 102);
    expect(screen.getByRole("button", { name: /clear painted \(0\)/i })).toBeInTheDocument();
  });

  it("a drag leaves a continuous stroke (interpolated, no gaps)", () => {
    const { container } = renderPainter();
    drag(canvas(container), [105, 105], [145, 105]);
    expect(screen.getByRole("button", { name: /clear painted \(5\)/i })).toBeInTheDocument();
  });

  it("Shift-drag paints a box", () => {
    const { container } = renderPainter();
    drag(canvas(container), [105, 105], [125, 125], { shiftKey: true });
    expect(screen.getByRole("button", { name: /clear painted \(9\)/i })).toBeInTheDocument();
  });

  it("does nothing on a right-click", () => {
    const { container } = renderPainter();
    pointer(canvas(container), "pointerdown", 105, 105, { button: 2 });
    expect(screen.getByRole("button", { name: /clear painted \(0\)/i })).toBeInTheDocument();
  });

  it("tolerates pointer events with no coordinates", () => {
    const { container } = renderPainter();
    expect(() => {
      fireEvent.pointerDown(canvas(container));
      fireEvent.pointerMove(canvas(container));
      fireEvent.pointerUp(canvas(container));
    }).not.toThrow();
  });

  it("creates a region from painted cells: merged rects, active brush, label defaulting to the id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    drag(canvas(container), [105, 105], [125, 105]); // 3 cells in a row
    drag(canvas(container), [105, 115], [125, 115]); // and the row below -> one 30x20 rect
    expect(screen.getByRole("button", { name: /create region/i })).toBeDisabled(); // no id yet
    await user.type(screen.getByRole("textbox", { name: "Region id" }), "new-zone");
    await user.click(screen.getByRole("button", { name: /create region/i }));
    const next = lastLayout(onChange);
    const created = next.regions.find((r) => r.id === "new-zone")!;
    expect(created).toEqual({ id: "new-zone", kind: "zone", label: "new-zone", rects: [[100, 100, 130, 120]] });
    expect(next.regions).toHaveLength(3);
    // The draft is cleared and the region is listed.
    expect(screen.getByRole("button", { name: /clear painted \(0\)/i })).toBeInTheDocument();
    expect(screen.getByText("Regions (3)")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("new-zone: 1 rect.");
  });

  it("uses the chosen brush and label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    pointer(canvas(container), "pointerdown", 205, 205);
    pointer(canvas(container), "pointerup", 205, 205);
    await user.type(screen.getByRole("textbox", { name: "Region id" }), "b9");
    await user.type(screen.getByRole("textbox", { name: "Region label" }), "Block 9");
    await user.selectOptions(screen.getByRole("combobox", { name: "Brush" }), "bldg");
    await user.click(screen.getByRole("button", { name: /create region/i }));
    expect(lastLayout(onChange).regions.find((r) => r.id === "b9")).toMatchObject({ kind: "bldg", label: "Block 9" });
  });

  it("re-painting an existing id replaces its geometry but keeps extra fields (memberIds)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    pointer(canvas(container), "pointerdown", 305, 305);
    pointer(canvas(container), "pointerup", 305, 305);
    await user.type(screen.getByRole("textbox", { name: "Region id" }), "r1");
    expect(screen.getByText(/existing region has this id/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create region/i }));
    const next = lastLayout(onChange);
    expect(next.regions.filter((r) => r.id === "r1")).toHaveLength(1);
    expect(next.regions.find((r) => r.id === "r1")).toMatchObject({ rects: [[300, 300, 310, 310]], memberIds: ["m1", "m2"] });
  });

  it("Edit loads a region's cells back into the draft and Update replaces it in place", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Edit r1" }));
    expect(screen.getByRole("button", { name: /clear painted \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Region id" })).toHaveValue("r1");
    expect(screen.getByRole("textbox", { name: "Region label" })).toHaveValue("Region One");
    expect(screen.getByText("Re-painting r1")).toBeInTheDocument();
    // The region is NOT removed up-front, so abandoning the edit loses nothing.
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /update region/i }));
    const next = lastLayout(onChange);
    expect(next.regions.filter((r) => r.id === "r1")).toHaveLength(1);
    expect(next.regions.find((r) => r.id === "r1")).toMatchObject({ rects: [[0, 0, 20, 10]], memberIds: ["m1", "m2"] });
  });

  it("renaming a region while editing it removes the old id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Edit r1" }));
    await user.clear(screen.getByRole("textbox", { name: "Region id" }));
    await user.type(screen.getByRole("textbox", { name: "Region id" }), "r1-renamed");
    await user.click(screen.getByRole("button", { name: /update region/i }));
    const ids = lastLayout(onChange).regions.map((r) => r.id);
    expect(ids).toContain("r1-renamed");
    expect(ids).not.toContain("r1");
  });

  it("Clear painted abandons an edit without touching the layout", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Edit r1" }));
    await user.click(screen.getByRole("button", { name: /clear painted/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("New region from painted area")).toBeInTheDocument();
    expect(screen.getByText("Regions (2)")).toBeInTheDocument();
  });

  it("onCreateRegion can transform the region", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCreateRegion = vi.fn((r) => ({ ...r, label: r.label.toUpperCase() }));
    const { container } = renderPainter({ onChange, onCreateRegion });
    pointer(canvas(container), "pointerdown", 5, 405);
    pointer(canvas(container), "pointerup", 5, 405);
    await user.type(screen.getByRole("textbox", { name: "Region id" }), "abc");
    await user.click(screen.getByRole("button", { name: /create region/i }));
    expect(onCreateRegion).toHaveBeenCalledWith(expect.objectContaining({ id: "abc", kind: "zone" }));
    expect(lastLayout(onChange).regions.find((r) => r.id === "abc")!.label).toBe("ABC");
  });

  it("onCreateRegion returning false vetoes creation and keeps the draft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange, onCreateRegion: () => false });
    pointer(canvas(container), "pointerdown", 5, 405);
    pointer(canvas(container), "pointerup", 5, 405);
    await user.type(screen.getByRole("textbox", { name: "Region id" }), "abc");
    await user.click(screen.getByRole("button", { name: /create region/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(/was not created/i);
    expect(screen.getByRole("button", { name: /clear painted \(1\)/i })).toBeInTheDocument();
  });

  it("renderCellForm replaces the default form and receives working state + create()", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({
      onChange,
      renderCellForm: (ctx) => (
        <div data-testid="custom-form">
          <span>{`cells:${ctx.cellCount} brush:${ctx.brushId} can:${ctx.canCreate}`}</span>
          <button onClick={() => ctx.setId("picked-id")}>pick</button>
          <button onClick={ctx.create}>make</button>
        </div>
      ),
    });
    expect(screen.queryByRole("textbox", { name: "Region id" })).toBeNull();
    pointer(canvas(container), "pointerdown", 5, 405);
    pointer(canvas(container), "pointerup", 5, 405);
    expect(screen.getByTestId("custom-form")).toHaveTextContent("cells:1 brush:zone can:false");
    await user.click(screen.getByRole("button", { name: "pick" }));
    expect(screen.getByTestId("custom-form")).toHaveTextContent("can:true");
    await user.click(screen.getByRole("button", { name: "make" }));
    expect(lastLayout(onChange).regions.some((r) => r.id === "picked-id")).toBe(true);
  });

  it("offers idSuggestions through a datalist on the default id field", () => {
    const { container } = renderPainter({ idSuggestions: ["alpha", "beta"] });
    const input = screen.getByRole("combobox", { name: "Region id" }); // a `list` attribute turns a textbox into a combobox
    const list = container.querySelector(`#${input.getAttribute("list")}`)!;
    expect([...list.querySelectorAll("option")].map((o) => o.getAttribute("value"))).toEqual(["alpha", "beta"]);
  });

  it("warns instead of creating when the id is empty and cells are missing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({
      onChange,
      renderCellForm: (ctx) => <button onClick={ctx.create}>make</button>,
    });
    await user.click(screen.getByRole("button", { name: "make" }));
    expect(screen.getByRole("status")).toHaveTextContent("Paint at least one cell first.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("changing the cell size converts painted-but-uncreated cells through canvas units", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    pointer(canvas(container), "pointerdown", 205, 205);
    pointer(canvas(container), "pointerup", 205, 205);
    await user.selectOptions(screen.getByRole("combobox", { name: "Grid" }), "20");
    expect(lastLayout(onChange).cellSize).toBe(20);
    // The 10-unit cell at (200,200) now sits inside one 20-unit cell.
    expect(screen.getByRole("button", { name: /clear painted \(1\)/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Grid" }), "10");
    // ... and growing it back yields the 2x2 block that 20-unit cell covers (the draft rounds outward).
    expect(screen.getByRole("button", { name: /clear painted \(4\)/i })).toBeInTheDocument();
  });
});

describe("HeatmapPainter — destructive actions need a second press", () => {
  it("Clear all arms, then confirms; blur disarms", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    const clear = screen.getByRole("button", { name: "Clear all regions (2)" });
    await user.click(clear);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /confirm clear all regions/i })).toBeInTheDocument();
    await user.tab(); // moves focus away -> disarm
    expect(screen.getByRole("button", { name: "Clear all regions (2)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear all regions (2)" }));
    await user.click(screen.getByRole("button", { name: /confirm clear all regions/i }));
    expect(lastLayout(onChange).regions).toEqual([]);
    expect(screen.getByRole("button", { name: /clear all regions \(0\)/i })).toBeDisabled();
  });

  it("deleting a region needs confirmation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Delete r2" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /confirm delete r2/i }));
    expect(lastLayout(onChange).regions.map((r) => r.id)).toEqual(["r1"]);
  });
});

describe("HeatmapPainter — brushes", () => {
  it("adds a brush (slugged id, swatch colour) and makes it active", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onActiveBrushChange = vi.fn();
    renderPainter({ onChange, onActiveBrushChange });
    await user.type(screen.getByRole("textbox", { name: "New brush name" }), "Plant Room");
    await user.click(screen.getByRole("button", { name: "Add brush" }));
    const brush = lastLayout(onChange).brushes.find((b) => b.id === "plant-room")!;
    expect(brush).toMatchObject({ label: "Plant Room" });
    expect(brush.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(onActiveBrushChange).toHaveBeenLastCalledWith("plant-room");
    expect(screen.getByRole("radio", { name: "Paint with Plant Room" })).toBeChecked();
  });

  it("Enter in the new-brush field adds it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.type(screen.getByRole("textbox", { name: "New brush name" }), "Quick{Enter}");
    expect(lastLayout(onChange).brushes.some((b) => b.id === "quick")).toBe(true);
  });

  it("edits a brush's label and its label/default-visible flags", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    const row = document.querySelectorAll('[data-rebar-part="brush-row"]')[0] as HTMLElement;
    fireEvent.change(within(row).getByRole("textbox", { name: "Brush name Zone" }), { target: { value: "Zones" } });
    expect(lastLayout(onChange).brushes[0]!.label).toBe("Zones");
    await user.click(within(row).getByRole("checkbox", { name: "labels" }));
    expect(lastLayout(onChange).brushes[0]!.showLabel).toBe(false);
    await user.click(within(row).getByRole("checkbox", { name: "shown by default" }));
    expect(lastLayout(onChange).brushes[0]!.defaultVisible).toBe(false);
  });

  it("materialises an undeclared brush when it is edited", () => {
    const onChange = vi.fn();
    renderPainter({ defaultValue: { ...LAYOUT, brushes: [], regions: [{ id: "x", kind: "legacy", label: "X", rects: [[0, 0, 10, 10]] }] }, onChange });
    fireEvent.change(screen.getByRole("textbox", { name: "Brush name legacy" }), { target: { value: "Legacy!" } });
    expect(lastLayout(onChange).brushes).toEqual([expect.objectContaining({ id: "legacy", label: "Legacy!" })]);
  });

  it("refuses to delete a brush that regions still use", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Delete brush Zone" }));
    await user.click(screen.getByRole("button", { name: /confirm delete brush zone/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(/still use that brush/i);
  });

  it("deletes an unused brush", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange, defaultValue: { ...LAYOUT, brushes: [...LAYOUT.brushes, { id: "spare", label: "Spare", color: "#000000" }] } });
    await user.click(screen.getByRole("button", { name: "Delete brush Spare" }));
    await user.click(screen.getByRole("button", { name: /confirm delete brush spare/i }));
    expect(screen.queryByRole("radio", { name: "Paint with Spare" })).toBeNull();
  });

  it("activeBrushId is controlled when given", async () => {
    const user = userEvent.setup();
    const onActiveBrushChange = vi.fn();
    renderPainter({ activeBrushId: "bldg", onActiveBrushChange });
    expect(screen.getByRole("radio", { name: "Paint with Building" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Paint with Zone" }));
    expect(onActiveBrushChange).toHaveBeenCalledWith("zone");
    expect(screen.getByRole("radio", { name: "Paint with Building" })).toBeChecked();
  });

  it("defaultActiveBrushId seeds the uncontrolled brush, falling back to the first brush", () => {
    const { unmount } = renderPainter({ defaultActiveBrushId: "bldg" });
    expect(screen.getByRole("radio", { name: "Paint with Building" })).toBeChecked();
    unmount();
    renderPainter({ defaultActiveBrushId: "nope" });
    expect(screen.getByRole("radio", { name: "Paint with Zone" })).toBeChecked();
  });
});

describe("HeatmapPainter — frames", () => {
  it("adds a frame around the visible area, selects it and switches to the frame tool", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: /add a frame around/i }));
    const frames = lastLayout(onChange).frames;
    expect(frames).toHaveLength(2);
    expect(frames[1]).toMatchObject({ id: "frame-2", title: "Frame 2" });
    // 800x560 viewport at zoom 1, cell 10: 10%..90%, snapped to the grid.
    expect(frames[1]!.crop).toEqual([80, 60, 720, 500]);
    expect(container.querySelector('[data-rebar-component="heatmap-painter"]')).toHaveAttribute("data-rebar-state", "frame");
    expect(document.querySelectorAll('[data-rebar-part="frame-row"]')[1]).toHaveAttribute("data-rebar-state", "selected");
  });

  it("renames a frame", () => {
    const onChange = vi.fn();
    renderPainter({ onChange });
    fireEvent.change(screen.getByRole("textbox", { name: "Frame title Frame 1" }), { target: { value: "Level 2" } });
    expect(lastLayout(onChange).frames[0]!.title).toBe("Level 2");
  });

  it("deletes a frame after confirmation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Delete frame Frame 1" }));
    await user.click(screen.getByRole("button", { name: /confirm delete frame frame 1/i }));
    expect(lastLayout(onChange).frames).toEqual([]);
  });

  it("Delete on the focused canvas removes the selected frame (frame tool only)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    await user.click(screen.getByRole("textbox", { name: "Frame title Frame 1" })); // selects it + frame tool
    canvas(container).focus();
    await user.keyboard("{Delete}");
    expect(lastLayout(onChange).frames).toEqual([]);
  });

  it("Delete is ignored in paint tool", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    canvas(container).focus();
    await user.keyboard("{Delete}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("draws a new frame by dragging on empty canvas (snapped to the grid)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Frame" }));
    drag(canvas(container), [203, 207], [303, 297]);
    const frames = lastLayout(onChange).frames;
    expect(frames).toHaveLength(2);
    expect(frames[1]!.crop).toEqual([200, 210, 300, 300]);
  });

  it("ignores a frame drag smaller than two cells", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Frame" }));
    drag(canvas(container), [203, 207], [211, 213]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves a frame by dragging its body", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    await user.click(screen.getByRole("button", { name: "Frame" }));
    drag(canvas(container), [50, 50], [80, 70]);
    expect(lastLayout(onChange).frames[0]!.crop).toEqual([30, 20, 130, 120]);
  });

  it("resizes the selected frame by a handle, never below one cell", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderPainter({ onChange });
    await user.click(screen.getByRole("textbox", { name: "Frame title Frame 1" })); // select it
    drag(canvas(container), [100, 100], [160, 140]); // the 'se' handle
    expect(lastLayout(onChange).frames[0]!.crop).toEqual([0, 0, 160, 140]);
    drag(canvas(container), [160, 140], [-500, -500]);
    expect(lastLayout(onChange).frames[0]!.crop).toEqual([0, 0, 10, 10]);
  });
});

describe("HeatmapPainter — panning", () => {
  it("middle-button drag pans the camera without painting", () => {
    const { container } = renderPainter();
    drag(canvas(container), [100, 100], [160, 130], { button: 1 });
    expect(screen.getByRole("button", { name: /clear painted \(0\)/i })).toBeInTheDocument();
  });

  it("Space + drag pans without painting", () => {
    const { container } = renderPainter();
    fireEvent.keyDown(window, { code: "Space" });
    drag(canvas(container), [100, 100], [160, 130]);
    fireEvent.keyUp(window, { code: "Space" });
    expect(screen.getByRole("button", { name: /clear painted \(0\)/i })).toBeInTheDocument();
    drag(canvas(container), [100, 100], [100, 100]);
    expect(screen.getByRole("button", { name: /clear painted \(1\)/i })).toBeInTheDocument();
  });

  it("Space typed into an input is not treated as a pan key", async () => {
    const user = userEvent.setup();
    const { container } = renderPainter();
    await user.type(screen.getByRole("textbox", { name: "Region label" }), "a b");
    drag(canvas(container), [100, 100], [100, 100]);
    expect(screen.getByRole("button", { name: /clear painted \(1\)/i })).toBeInTheDocument();
  });
});

describe("HeatmapPainter — controlled / uncontrolled layout", () => {
  it("uncontrolled: edits stick without an onChange handler", async () => {
    const user = userEvent.setup();
    renderPainter();
    await user.type(screen.getByRole("textbox", { name: "New brush name" }), "Extra{Enter}");
    expect(screen.getByText("Brushes (3)")).toBeInTheDocument();
  });

  it("controlled: the layout only changes when the parent applies onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ value: LAYOUT, defaultValue: undefined, onChange });
    await user.type(screen.getByRole("textbox", { name: "New brush name" }), "Extra{Enter}");
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText("Brushes (2)")).toBeInTheDocument(); // parent never applied it
  });

  it("controlled: a parent that applies onChange sees the edit", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [layout, setLayout] = useState(LAYOUT);
      return (
        <>
          <output data-testid="count">{layout.brushes.length}</output>
          <HeatmapPainter value={layout} onChange={setLayout} defaultCamera={CAMERA} />
        </>
      );
    }
    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "New brush name" }), "Extra{Enter}");
    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(screen.getByText("Brushes (3)")).toBeInTheDocument();
  });

  it("a burst of edits inside one gesture accumulates even when the host echoes slowly", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn(); // never fed back: controlled value stays at LAYOUT
    const { container } = renderPainter({ value: LAYOUT, defaultValue: undefined, onChange });
    await user.click(screen.getByRole("button", { name: "Frame" }));
    drag(canvas(container), [50, 50], [60, 60]);
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("HeatmapPainter — tracing image", () => {
  const withImage: HeatmapLayout = {
    ...LAYOUT,
    background: { url: "/trace.png", x: 0, y: 0, scale: 1, opacity: 0.6, width: 400, height: 300 },
  };

  it("offers no upload control without onUploadBackground, but explains why", () => {
    renderPainter();
    expect(screen.queryByRole("button", { name: /upload image/i })).toBeNull();
    expect(screen.getByText(/no image storage is configured/i)).toBeInTheDocument();
  });

  it("hands the chosen file to onUploadBackground and records the returned URL and size", async () => {
    const onChange = vi.fn();
    const onUploadBackground = vi.fn().mockResolvedValue({ url: "https://cdn.example/plan.png", width: 640, height: 480, version: 2 });
    const { container } = renderPainter({ onChange, onUploadBackground });
    const file = new File(["x"], "plan.png", { type: "image/png" });
    fireEvent.change(container.querySelector('[data-rebar-part="image-input"]')!, { target: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onUploadBackground).toHaveBeenCalledWith(file);
    expect(lastLayout(onChange).background).toMatchObject({
      url: "https://cdn.example/plan.png",
      width: 640,
      height: 480,
      version: 2,
      x: 0,
      y: 0,
      scale: 1,
      opacity: 0.6,
    });
    expect(screen.getByRole("status")).toHaveTextContent(/image placed/i);
  });

  it("keeps the existing placement when an image is replaced", async () => {
    const onChange = vi.fn();
    const onUploadBackground = vi.fn().mockResolvedValue({ url: "/new.png", width: 10, height: 10 });
    const { container } = renderPainter({
      onChange,
      onUploadBackground,
      defaultValue: { ...withImage, background: { ...withImage.background!, x: 30, y: 40, scale: 2, opacity: 0.3, showInPlot: true } },
    });
    fireEvent.change(container.querySelector('[data-rebar-part="image-input"]')!, { target: { files: [new File(["x"], "a.png")] } });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(lastLayout(onChange).background).toMatchObject({ url: "/new.png", x: 30, y: 40, scale: 2, opacity: 0.3, showInPlot: true });
  });

  it("reports an upload failure in the status line and leaves the layout alone", async () => {
    const onChange = vi.fn();
    const onUploadBackground = vi.fn().mockRejectedValue(new Error("Disk full"));
    const { container } = renderPainter({ onChange, onUploadBackground });
    fireEvent.change(container.querySelector('[data-rebar-part="image-input"]')!, { target: { files: [new File(["x"], "a.png")] } });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Disk full"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("edits opacity, scale, position and showInPlot", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange, defaultValue: withImage });
    fireEvent.change(screen.getByRole("slider", { name: /opacity/i }) ?? screen.getByLabelText("Opacity"), { target: { value: "0.2" } });
    expect(lastLayout(onChange).background!.opacity).toBe(0.2);
    fireEvent.change(screen.getByLabelText("Scale"), { target: { value: "1.5" } });
    expect(lastLayout(onChange).background!.scale).toBe(1.5);
    fireEvent.change(screen.getByLabelText("X"), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText("Y"), { target: { value: "-5" } });
    expect(lastLayout(onChange).background).toMatchObject({ x: 25, y: -5 });
    await user.click(screen.getByRole("checkbox", { name: /include this image in the final plot/i }));
    expect(lastLayout(onChange).background!.showInPlot).toBe(true);
  });

  it("removing the image calls onRemoveBackground, then clears it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onRemoveBackground = vi.fn().mockResolvedValue(undefined);
    renderPainter({ onChange, onRemoveBackground, defaultValue: withImage });
    await user.click(screen.getByRole("button", { name: "Remove image" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onRemoveBackground).toHaveBeenCalledTimes(1);
    expect(lastLayout(onChange).background).toBeUndefined();
  });

  it("a failing onRemoveBackground keeps the image", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPainter({ onChange, onRemoveBackground: () => Promise.reject(new Error("nope")), defaultValue: withImage });
    await user.click(screen.getByRole("button", { name: "Remove image" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("nope"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("HeatmapPainter — region list", () => {
  it("shows each region's id and brush", () => {
    renderPainter();
    const rows = document.querySelectorAll('[data-rebar-part="region-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("r1");
    expect(rows[0]).toHaveTextContent("Zone");
    expect(rows[1]).toHaveTextContent("Building");
  });
});
