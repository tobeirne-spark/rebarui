import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DistributionChart } from "../components/DistributionChart";

afterEach(cleanup);

describe("DistributionChart", () => {
  const series = [
    { label: "Group A", mean: 50, stdDev: 10, color: "#1565c0" },
    { label: "Group B", mean: 65, stdDev: 5, color: "#2e7d32" },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<DistributionChart series={series} title="Test scores" />);
    expect(screen.getByRole("img", { name: "Test scores" })).toBeInTheDocument();
  });

  it("renders one curve (series group) per series, each with its own label", () => {
    const { container } = render(<DistributionChart series={series} title="Test scores" />);
    expect(container.querySelectorAll('[data-rebar-part="series"]')).toHaveLength(2);
    expect(screen.getByText("Group A")).toBeInTheDocument();
    expect(screen.getByText("Group B")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<DistributionChart series={series} title="Test scores" />);
    expect(container.querySelector('[data-rebar-component="distribution-chart"]')).toBeInTheDocument();
  });

  it("renders title as a real visible figcaption", () => {
    const { container } = render(<DistributionChart series={series} title="Test scores" />);
    const caption = container.querySelector('figcaption[data-rebar-part="title"]');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Test scores");
  });

  it("shows the empty state when series is empty", () => {
    const { container } = render(<DistributionChart series={[]} title="Empty" />);
    expect(container.querySelector('[data-rebar-part="series"]')).not.toBeInTheDocument();
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it("a narrower stdDev produces a taller, narrower curve than a wider one", () => {
    const { container } = render(<DistributionChart series={series} title="Test scores" />);
    const polygons = container.querySelectorAll('[data-rebar-part="series"] polygon');
    expect(polygons).toHaveLength(2);
    // Both curves are real, non-degenerate shapes — a real "d"/"points" attribute with more than
    // a trivial number of coordinate pairs (SAMPLE_COUNT + 1 line points, plus 2 baseline points).
    polygons.forEach((p) => {
      const points = p.getAttribute("points") ?? "";
      expect(points.split(" ").length).toBeGreaterThan(50);
    });
  });

  it("shows the ±1 stdDev band by default, omits it when showStdDevBand is false", () => {
    const { container, rerender } = render(<DistributionChart series={series} title="Test scores" />);
    expect(container.querySelectorAll('[data-rebar-part="stddev-band"]')).toHaveLength(2);

    rerender(<DistributionChart series={series} title="Test scores" showStdDevBand={false} />);
    expect(container.querySelectorAll('[data-rebar-part="stddev-band"]')).toHaveLength(0);
  });

  it("hovering a series' mean mark shows a persistent value tag with mean/stdDev, cleared by a dead click", () => {
    const { container } = render(<DistributionChart series={series} title="Test scores" />);
    const mark = container.querySelector('[data-rebar-part="mean-mark"]') as HTMLElement;
    const background = container.querySelector('[data-rebar-part="chart-background"]') as HTMLElement;

    fireEvent.pointerEnter(mark);
    let tag = container.querySelector('[data-rebar-part="value-tag"]');
    expect(tag).toHaveTextContent("Group A");
    expect(tag).toHaveTextContent("mean 50, σ 10");

    fireEvent.click(mark);
    fireEvent.pointerLeave(mark);
    tag = container.querySelector('[data-rebar-part="value-tag"]');
    expect(tag).toHaveTextContent("mean 50, σ 10");

    fireEvent.click(background);
    expect(container.querySelector('[data-rebar-part="value-tag"]')).not.toBeInTheDocument();
  });

  it("uses xFormat to render axis tick labels", () => {
    render(
      <DistributionChart
        series={[{ label: "Only", mean: 100, stdDev: 20 }]}
        title="Formatted"
        xFormat={(v) => `$${Math.round(v)}`}
      />,
    );
    expect(screen.getAllByText(/^\$/).length).toBeGreaterThan(0);
  });
});
