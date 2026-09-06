import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GaugeChart } from "../components/GaugeChart";

afterEach(cleanup);

describe("GaugeChart", () => {
  it("renders a real svg with an accessible name from title", () => {
    render(<GaugeChart value={72} title="CPU load" />);
    expect(screen.getByRole("img", { name: "CPU load" })).toBeInTheDocument();
  });

  it("falls back to label, then a default, for the accessible name", () => {
    const { rerender } = render(<GaugeChart value={72} label="CPU load" />);
    expect(screen.getByRole("img", { name: "CPU load" })).toBeInTheDocument();
    rerender(<GaugeChart value={72} />);
    expect(screen.getByRole("img", { name: "Gauge chart" })).toBeInTheDocument();
  });

  it("renders a track arc and a value arc, plus the numeric value centered", () => {
    const { container } = render(<GaugeChart value={40} min={0} max={100} title="Score" />);
    expect(container.querySelector('path[data-rebar-part="track"]')).toBeInTheDocument();
    expect(container.querySelector('path[data-rebar-part="value"]')).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders title as a real visible figcaption", () => {
    const { container } = render(<GaugeChart value={40} title="Score" />);
    const caption = container.querySelector('figcaption[data-rebar-part="title"]');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Score");
  });

  it("clamps a value above max to a full value arc without overflowing or duplicating it", () => {
    const { container } = render(<GaugeChart value={150} min={0} max={100} title="Overshoot" />);
    // Still shows the real, unclamped value as text (matches the real world instead of hiding an
    // overshoot) while the arc itself is clamped to exactly one full-track value path.
    expect(screen.getByText("150")).toBeInTheDocument();
    const valueArcs = container.querySelectorAll('path[data-rebar-part="value"]');
    expect(valueArcs).toHaveLength(1);
    const trackD = container.querySelector('path[data-rebar-part="track"]')?.getAttribute("d");
    const valueD = valueArcs[0]?.getAttribute("d");
    // The clamped value arc spans the same endpoints as the full track (start -90°..90°).
    expect(valueD).toBe(trackD);
  });

  it("clamps a value below min to render no filled value arc", () => {
    const { container } = render(<GaugeChart value={-20} min={0} max={100} title="Undershoot" />);
    expect(screen.getByText("-20")).toBeInTheDocument();
    expect(container.querySelectorAll('path[data-rebar-part="value"]')).toHaveLength(0);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<GaugeChart value={40} title="Score" />);
    expect(container.querySelector('[data-rebar-component="gauge-chart"]')).toBeInTheDocument();
  });
});
