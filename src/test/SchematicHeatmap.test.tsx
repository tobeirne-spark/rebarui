import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SchematicHeatmap } from "../components/SchematicHeatmap";
import { defaultColorScale } from "../components/heatmapGeometry";
import type { HeatmapRegion } from "../components/heatmapGeometry";

const REGIONS: HeatmapRegion[] = [
  { id: "a", kind: "zone", label: "Zone A", rects: [[0, 0, 100, 50]] },
  { id: "b", kind: "zone", label: "Zone B", rects: [[0, 50, 100, 100], [0, 100, 50, 150]] },
  { id: "c", kind: "quiet", label: "Quiet C", rects: [[100, 0, 200, 50]] },
];

const VALUES = { a: { done: 3, expected: 4 }, b: 0.5 };

function renderPlot(props: Partial<React.ComponentProps<typeof SchematicHeatmap>> = {}) {
  return render(<SchematicHeatmap regions={REGIONS} values={VALUES} crop={[0, 0, 200, 150]} ariaLabel="Test plot" {...props} />);
}

const region = (container: HTMLElement, id: string) => container.querySelector(`[data-region="${id}"]`) as SVGGElement;

describe("SchematicHeatmap", () => {
  it("carries data-rebar-component, a named group, and one focusable region per shape", () => {
    const { container } = renderPlot();
    const root = container.querySelector('[data-rebar-component="schematic-heatmap"]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("data-rebar-state", "idle");
    expect(screen.getByRole("group", { name: "Test plot" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(container.querySelectorAll('[data-rebar-part="region"]')).toHaveLength(3);
  });

  it("forwards data-* and aria-* to the root and merges className", () => {
    const { container } = renderPlot({ className: "extra", "data-testid": "plot", "aria-describedby": "d" } as never);
    const root = container.querySelector('[data-rebar-component="schematic-heatmap"]')!;
    expect(root).toHaveClass("rebar-schematic-heatmap", "extra");
    expect(root).toHaveAttribute("data-testid", "plot");
    expect(root).toHaveAttribute("aria-describedby", "d");
  });

  it("sets the viewBox from the crop", () => {
    const { container } = renderPlot({ crop: [-10, -20, 190, 130] });
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "-10 -20 200 150");
  });

  it("defaults the crop to the regions' bounds plus a margin", () => {
    const { container } = renderPlot({ crop: undefined });
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "-20 -20 240 190");
  });

  it("draws a region with several rects as several fills but exactly ONE outline path", () => {
    const { container } = renderPlot();
    const b = region(container, "b");
    expect(b.querySelectorAll("rect")).toHaveLength(2);
    expect(b.querySelectorAll('[data-rebar-part="region-outline"]')).toHaveLength(1);
    // The L-shaped union is one closed six-corner loop.
    expect(b.querySelector('[data-rebar-part="region-outline"]')).toHaveAttribute("d", "M0 50H100V100H50V150H0Z");
  });

  it("shades valued regions by share and draws missing data as a hatch, never as 0%", () => {
    const { container } = renderPlot();
    expect(region(container, "a").querySelector("rect")).toHaveAttribute("fill", defaultColorScale(0.75));
    expect(region(container, "b").querySelector("rect")).toHaveAttribute("fill", defaultColorScale(0.5));
    expect(region(container, "c").querySelector("rect")!.getAttribute("fill")).toMatch(/^url\(#rebar-schematic-hatch/);
    expect(region(container, "c")).toHaveAttribute("data-rebar-state", "no-data");
    expect(region(container, "a")).toHaveAttribute("data-rebar-state", "value");
  });

  it("treats expected = 0 as no data", () => {
    const { container } = renderPlot({ values: { a: { done: 0, expected: 0 } } });
    expect(region(container, "a")).toHaveAttribute("data-rebar-state", "no-data");
  });

  it("accepts a custom colorScale", () => {
    const { container } = renderPlot({ colorScale: (s) => (s > 0.6 ? "rgb(1, 2, 3)" : "rgb(9, 9, 9)") });
    expect(region(container, "a").querySelector("rect")).toHaveAttribute("fill", "rgb(1, 2, 3)");
    expect(region(container, "b").querySelector("rect")).toHaveAttribute("fill", "rgb(9, 9, 9)");
  });

  it("describes each region in its accessible name and tooltip", () => {
    renderPlot();
    expect(screen.getByRole("button", { name: "Zone A: 75.0% (3 / 4)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zone B: 50.0%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quiet C: no data" })).toBeInTheDocument();
  });

  it("shows the hint until a region is hovered, then that region's numbers", () => {
    const { container } = renderPlot();
    const readout = container.querySelector('[data-rebar-part="readout"]')!;
    expect(readout).toHaveTextContent(/hover or focus a region/i);
    fireEvent.pointerEnter(region(container, "a"));
    expect(readout).toHaveTextContent("Zone A: 75.0% (3 / 4)");
    expect(container.querySelector('[data-rebar-component="schematic-heatmap"]')).toHaveAttribute("data-rebar-state", "hovering");
    fireEvent.pointerLeave(container.querySelector("svg")!);
    expect(readout).toHaveTextContent(/hover or focus a region/i);
  });

  it("shows the same readout on keyboard focus", async () => {
    const user = userEvent.setup();
    const { container } = renderPlot();
    await user.tab();
    expect(container.querySelector('[data-rebar-part="readout"]')).toHaveTextContent("Zone A");
    await user.tab();
    expect(container.querySelector('[data-rebar-part="readout"]')).toHaveTextContent("Zone B");
  });

  describe("selection", () => {
    it("is uncontrolled by default: click pins, click again un-pins", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = renderPlot({ onSelect });
      const a = region(container, "a");
      await user.click(a);
      expect(a).toHaveAttribute("aria-pressed", "true");
      expect(a).toHaveAttribute("data-rebar-state", "selected");
      expect(onSelect).toHaveBeenLastCalledWith("a");
      await user.click(a);
      expect(a).toHaveAttribute("aria-pressed", "false");
      expect(onSelect).toHaveBeenLastCalledWith(null);
    });

    it("honours defaultSelectedId", () => {
      const { container } = renderPlot({ defaultSelectedId: "b" });
      expect(region(container, "b")).toHaveAttribute("aria-pressed", "true");
      expect(container.querySelector('[data-rebar-component="schematic-heatmap"]')).toHaveAttribute("data-rebar-state", "selected");
    });

    it("draws the selected region's outline heavier", () => {
      const { container } = renderPlot({ selectedId: "a" });
      expect(region(container, "a").querySelector("path")).toHaveAttribute("stroke-width", "3");
      expect(region(container, "b").querySelector("path")).toHaveAttribute("stroke-width", "2");
    });

    it("is controlled when selectedId is given: it only moves when the parent says so", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = renderPlot({ selectedId: "c", onSelect });
      await user.click(region(container, "a"));
      expect(onSelect).toHaveBeenCalledWith("a");
      expect(region(container, "c")).toHaveAttribute("aria-pressed", "true");
      expect(region(container, "a")).toHaveAttribute("aria-pressed", "false");
    });

    it("works wired to parent state, including selectedId={null}", async () => {
      const user = userEvent.setup();
      function Harness() {
        const [id, setId] = useState<string | null>(null);
        return <SchematicHeatmap regions={REGIONS} values={VALUES} ariaLabel="x" selectedId={id} onSelect={setId} />;
      }
      const { container } = render(<Harness />);
      await user.click(region(container, "b"));
      expect(region(container, "b")).toHaveAttribute("aria-pressed", "true");
      await user.click(region(container, "b"));
      expect(region(container, "b")).toHaveAttribute("aria-pressed", "false");
    });

    it("is keyboard operable: Enter and Space pin, Escape clears", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = renderPlot({ onSelect });
      await user.tab();
      await user.keyboard("{Enter}");
      expect(onSelect).toHaveBeenLastCalledWith("a");
      expect(region(container, "a")).toHaveAttribute("aria-pressed", "true");
      await user.keyboard("{Escape}");
      expect(onSelect).toHaveBeenLastCalledWith(null);
      await user.keyboard(" ");
      expect(onSelect).toHaveBeenLastCalledWith("a");
    });
  });

  describe("labels and brushes", () => {
    it("draws a label per region by default", () => {
      const { container } = renderPlot();
      expect(container.querySelectorAll('[data-rebar-part="region-label"]')).toHaveLength(3);
    });

    it("omits labels for a brush with showLabel === false (list or record form)", () => {
      const brush = { id: "zone", label: "Zone", color: "#000000", showLabel: false };
      const { container, rerender } = renderPlot({ brushes: [brush] });
      expect(container.querySelectorAll('[data-rebar-part="region-label"]')).toHaveLength(1);
      rerender(<SchematicHeatmap regions={REGIONS} values={VALUES} crop={[0, 0, 200, 150]} ariaLabel="x" brushes={{ zone: brush }} />);
      expect(container.querySelectorAll('[data-rebar-part="region-label"]')).toHaveLength(1);
    });

    it("rotates the label of a tall narrow region", () => {
      const { container } = renderPlot({ regions: [{ id: "t", kind: "k", label: "Tall", rects: [[0, 0, 10, 100]] }] });
      expect(container.querySelector('[data-rebar-part="region-label"]')!.getAttribute("transform")).toContain("rotate(-90)");
    });
  });

  describe("legend", () => {
    it("renders a legend with default wording, overridable via labels", () => {
      const { container } = renderPlot({ labels: { noData: "not measured", low: "none", high: "all", hint: "Pick one" } });
      const legend = container.querySelector('[data-rebar-part="legend"]')!;
      expect(legend).toHaveTextContent("none");
      expect(legend).toHaveTextContent("all");
      expect(legend).toHaveTextContent("not measured");
      expect(container.querySelector('[data-rebar-part="readout"]')).toHaveTextContent("Pick one");
      expect(screen.getByRole("button", { name: "Quiet C: not measured" })).toBeInTheDocument();
    });

    it("is decorative to assistive tech (the readout and region names carry the data)", () => {
      const { container } = renderPlot();
      expect(container.querySelector('[data-rebar-part="legend"]')).toHaveAttribute("aria-hidden", "true");
    });

    it("can be hidden, and takes extra content", () => {
      const { container, rerender } = renderPlot({ hideLegend: true });
      expect(container.querySelector('[data-rebar-part="legend-row"]')).toBeNull();
      rerender(<SchematicHeatmap regions={REGIONS} ariaLabel="x" legendExtra={<button>Metric</button>} />);
      expect(screen.getByRole("button", { name: "Metric" })).toBeInTheDocument();
    });

    it("formatValue overrides the readout, tooltip and accessible name", () => {
      renderPlot({ formatValue: ({ region: r, share }) => `${r.id}=${share === null ? "n/a" : Math.round(share * 100)}` });
      expect(screen.getByRole("button", { name: "a=75" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "c=n/a" })).toBeInTheDocument();
    });
  });

  describe("tracing image", () => {
    const bg = { url: "/trace.png", x: 5, y: 6, scale: 2, opacity: 0.4, version: 3 };

    it("is not drawn unless showInPlot is on", () => {
      const { container } = renderPlot({ background: bg });
      expect(container.querySelector('[data-rebar-part="background"]')).toBeNull();
    });

    it("is drawn behind the regions at its position/scale/opacity when showInPlot is on", () => {
      const { container } = renderPlot({ background: { ...bg, showInPlot: true } });
      const img = container.querySelector('[data-rebar-part="background"]')!;
      expect(img).toHaveAttribute("href", "/trace.png?v=3");
      expect(img).toHaveAttribute("transform", "translate(5 6) scale(2)");
      expect(img).toHaveAttribute("opacity", "0.4");
      // Painted first, so it sits behind every region.
      expect(img.nextElementSibling).toHaveAttribute("data-rebar-part", "region");
    });
  });

  it("renders an empty plot without throwing", () => {
    const { container } = render(<SchematicHeatmap regions={[]} ariaLabel="Empty" />);
    expect(container.querySelectorAll('[data-rebar-part="region"]')).toHaveLength(0);
  });

  it("gives every instance its own hatch pattern id", () => {
    const { container } = render(
      <>
        <SchematicHeatmap regions={REGIONS} ariaLabel="one" />
        <SchematicHeatmap regions={REGIONS} ariaLabel="two" />
      </>,
    );
    const ids = [...container.querySelectorAll("pattern")].map((p) => p.id);
    expect(new Set(ids).size).toBe(2);
  });
});
