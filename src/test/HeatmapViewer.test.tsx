import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeatmapViewer } from "../components/HeatmapViewer";
import { createStubHeatmapSource } from "../components/heatmapViewerStub";
import type { HeatmapViewerSource } from "../components/heatmapViewerModel";

const region = (container: HTMLElement, id: string) => container.querySelector(`[data-region="${id}"]`) as SVGGElement;

async function renderViewer(props: Partial<React.ComponentProps<typeof HeatmapViewer>> = {}) {
  const utils = render(<HeatmapViewer {...props} />);
  // The stub resolves immediately; the first drawing and its snapshot land after a couple of microtasks.
  await waitFor(() => expect(utils.container.querySelector('[data-rebar-part="region"]')).not.toBeNull());
  return utils;
}

describe("HeatmapViewer", () => {
  it("runs standalone on the built-in stub source and carries data-rebar-component", async () => {
    const { container } = await renderViewer();
    expect(container.querySelector('[data-rebar-component="heatmap-viewer"]')).not.toBeNull();
    expect(screen.getByText("Heatmap")).toBeInTheDocument();
    // Fabric group is the default, so the two Fabric brushes' regions are drawn and the services are not.
    expect(region(container, "north-block")).not.toBeNull();
    expect(region(container, "plant-room")).toBeNull();
  });

  it("offers one brush group at a time and switches the visible brushes with the group", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    expect(screen.getByRole("radio", { name: "Fabric" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Building" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("radio", { name: "Services" }));
    await waitFor(() => expect(region(container, "plant-room")).not.toBeNull());
    expect(region(container, "north-block")).toBeNull();
  });

  it("toggles a brush chip to hide and show its regions", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    await user.click(screen.getByRole("button", { name: "Outdoor" }));
    expect(region(container, "car-park")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Outdoor" }));
    expect(region(container, "car-park")).not.toBeNull();
  });

  it("shades by the metric chosen, and the drawing's accessible name follows it", async () => {
    const user = userEvent.setup();
    await renderViewer();
    expect(screen.getByRole("group", { name: /Overall complete per zone, Campus handover/ })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Documents" }));
    expect(screen.getByRole("group", { name: /Documents per zone, Campus handover/ })).toBeInTheDocument();
  });

  it("switches shading by pressing a metric row in the panel", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    const row = container.querySelector('[data-rebar-part="metric-row"][data-metric="photos"]') as HTMLElement;
    expect(row).toHaveAttribute("aria-pressed", "false");
    await user.click(row);
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("radio", { name: "Photos" })).toBeChecked();
  });

  it("pins a region, speaks about it in the panel, Shift-adds a second, and clears on an empty press", async () => {
    const { container } = await renderViewer();
    const panelSubject = () => container.querySelector('[data-rebar-part="subject"]')!.textContent;
    expect(panelSubject()).toBe("All zones in view");
    fireEvent.click(region(container, "library"));
    expect(panelSubject()).toBe("Library");
    expect(region(container, "library")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(region(container, "east-hall"), { shiftKey: true });
    // Named in drawing order, not pin order.
    expect(panelSubject()).toBe("East Hall + Library");
    fireEvent.click(region(container, "library"), { shiftKey: true });
    expect(panelSubject()).toBe("East Hall");
    // A plain press on the only pinned region un-pins it.
    fireEvent.click(region(container, "east-hall"));
    expect(panelSubject()).toBe("All zones in view");
  });

  it("hides a metric from the panel via the metrics picker and keeps the shade options in step", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    await user.click(screen.getByRole("button", { name: "Choose which metrics to show" }));
    await user.click(await screen.findByRole("checkbox", { name: "Photos" }));
    expect(container.querySelector('[data-rebar-part="metric-row"][data-metric="photos"]')).toBeNull();
    expect(screen.queryByRole("radio", { name: "Photos" })).toBeNull();
  });

  it("switches to a table of zones sorted lowest first, where a zone name pins it", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    await user.click(screen.getByRole("radio", { name: "Table" }));
    const table = await screen.findByRole("table", { name: /per zone/ });
    const buttons = within(table).getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
    await user.click(within(table).getByRole("button", { name: "Library" }));
    expect(within(table).getByRole("button", { name: "Library" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("radio", { name: "Drawing" }));
    await waitFor(() => expect(region(container, "library")).toHaveAttribute("aria-pressed", "true"));
  });

  it("marks milestones on the slider and jumps to one when pressed", async () => {
    const user = userEvent.setup();
    const source = createStubHeatmapSource();
    const spy = vi.spyOn(source, "getSnapshot");
    const { container } = await renderViewer({ source });
    const markers = container.querySelectorAll('[data-rebar-part="milestone"]');
    expect(markers.length).toBeGreaterThan(0);
    spy.mockClear();
    await user.click(markers[0] as HTMLElement);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    const asked = spy.mock.calls[0]![0];
    expect(asked.date).not.toBeNull();
  });

  it("sends the slicer selections to the source with every request", async () => {
    const source = createStubHeatmapSource();
    const spy = vi.spyOn(source, "getSnapshot");
    await renderViewer({ source });
    expect(spy.mock.calls[0]![0]).toMatchObject({ heatmapId: "campus", date: null, filters: {} });
    expect(screen.getByRole("group", { name: "Heatmap filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeDisabled();
  });

  it("shows a placed panel for 'footer' and a pop-over panel for 'popover' placement", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    expect(container.querySelector('[data-rebar-part="layout"]')).toHaveAttribute("data-placement", "footer");
    expect(container.querySelector('[data-rebar-part="metrics-panel"]')).not.toBeNull();
    // Swap to the utilities drawing, whose panel is a pop-over: no docked panel until a region is pinned.
    await user.click(screen.getByRole("combobox", { name: "Heatmap drawing" }));
    await user.click(await screen.findByRole("option", { name: /Utilities run/ }));
    await waitFor(() => expect(container.querySelector('[data-region="run-A"]')).not.toBeNull());
    expect(container.querySelector('[data-rebar-part="layout"]')).toHaveAttribute("data-placement", "popover");
    expect(container.querySelector('[data-rebar-part="metrics-panel"]')).toBeNull();
    // A banded scale replaces the ramp legend.
    expect(container.querySelectorAll('[data-rebar-part="legend-band"]').length).toBeGreaterThan(3);
  });

  it("ships a spaceship example whose tracing image is inline seed data, not a hosted file", async () => {
    const source = createStubHeatmapSource();
    const def = await source.getHeatmap("starship");
    expect(def.background?.url).toMatch(/^data:image\/svg\+xml/);
    const { container } = await renderViewer({ source, heatmap: def });
    expect(container.querySelector('[data-rebar-part="background"]')).not.toBeNull();
    expect(region(container, "bridge")).not.toBeNull();
  });

  it("renders renderNarrative with the current reading once figures exist", async () => {
    const narrative = vi.fn(() => <p>The narrative</p>);
    await renderViewer({ renderNarrative: narrative });
    expect(await screen.findByText("The narrative")).toBeInTheDocument();
    const ctx = (narrative.mock.calls.at(-1) as unknown as [{ metric: { id: string }; regions: unknown[]; selected: unknown[] }])[0];
    expect(ctx.metric.id).toBe("overall");
    expect(ctx.regions.length).toBeGreaterThan(0);
    expect(ctx.selected).toEqual([]);
  });

  it("shows 'Not computed yet' / 'computing' rather than an empty drawing when the snapshot has no figures", async () => {
    const base = createStubHeatmapSource();
    const source: HeatmapViewerSource = { ...base, getSnapshot: async (q) => ({ ...(await base.getSnapshot(q)), cells: null, computing: true }) };
    render(<HeatmapViewer source={source} />);
    expect(await screen.findByText(/Computing the first snapshot/)).toBeInTheDocument();
  });

  it("surfaces a failing source as an alert, not a silent blank", async () => {
    const source: HeatmapViewerSource = { ...createStubHeatmapSource(), listHeatmaps: () => Promise.reject(new Error("backend down")) };
    render(<HeatmapViewer source={source} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("backend down");
  });

  it("shows a given heatmap instead of the library, with no drawing picker", async () => {
    const source = createStubHeatmapSource();
    const def = await source.getHeatmap("utilities");
    const { container } = await renderViewer({ source, heatmap: def });
    expect(region(container, "run-A")).not.toBeNull();
    expect(screen.queryByRole("combobox", { name: "Heatmap drawing" })).toBeNull();
  });

  it("offers Refresh only when the source can recompute, and asks it to", async () => {
    const user = userEvent.setup();
    const source = createStubHeatmapSource();
    const spy = vi.spyOn(source, "refresh");
    await renderViewer({ source });
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(spy).toHaveBeenCalledTimes(1);

    const { refresh: _drop, ...noRefresh } = createStubHeatmapSource();
    render(<HeatmapViewer source={noRefresh} title="Second" />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Refresh" })).toHaveLength(1));
  });

  it("toggles full screen with the button and closes it on Escape", async () => {
    const user = userEvent.setup();
    const { container } = await renderViewer();
    const root = container.querySelector('[data-rebar-component="heatmap-viewer"]')!;
    expect(root).not.toHaveAttribute("data-rebar-state");
    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(root).toHaveAttribute("data-rebar-state", "expanded");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(root).not.toHaveAttribute("data-rebar-state");
  });

  it("forwards data-* and merges className on the root", async () => {
    const { container } = await renderViewer({ className: "extra", "data-testid": "viewer" } as never);
    const root = container.querySelector('[data-rebar-component="heatmap-viewer"]')!;
    expect(root).toHaveClass("rebar-heatmap-viewer", "extra");
    expect(root).toHaveAttribute("data-testid", "viewer");
  });
});
