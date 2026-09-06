import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PieChart } from "../components/PieChart";

afterEach(cleanup);

describe("PieChart", () => {
  const slices = [
    { label: "Direct", value: 40, color: "#1565c0" },
    { label: "Referral", value: 30, color: "#2e7d32" },
    { label: "Organic", value: 30, color: "#f57c00" },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<PieChart slices={slices} title="Traffic sources" />);
    expect(screen.getByRole("img", { name: "Traffic sources" })).toBeInTheDocument();
  });

  it("uses ariaLabel over title when both are given", () => {
    render(<PieChart slices={slices} title="Traffic sources" ariaLabel="Where visitors came from" />);
    expect(screen.getByRole("img", { name: "Where visitors came from" })).toBeInTheDocument();
  });

  it("renders one path per slice and one legend item per slice with its percentage", () => {
    const { container } = render(<PieChart slices={slices} title="Traffic sources" />);
    expect(container.querySelectorAll('path[data-rebar-part="slice"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-rebar-part="legend-item"]')).toHaveLength(3);
    expect(screen.getByText("Direct (40%)")).toBeInTheDocument();
    expect(screen.getByText("Referral (30%)")).toBeInTheDocument();
    expect(screen.getByText("Organic (30%)")).toBeInTheDocument();
  });

  it("renders title as a real visible figcaption", () => {
    const { container } = render(<PieChart slices={slices} title="Traffic sources" />);
    const caption = container.querySelector('figcaption[data-rebar-part="title"]');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Traffic sources");
  });

  it("omits the figcaption entirely when no title is given", () => {
    const { container } = render(<PieChart slices={slices} />);
    expect(container.querySelector("figcaption")).not.toBeInTheDocument();
  });

  it("handles a single slice worth 100% without a degenerate arc", () => {
    const { container } = render(<PieChart slices={[{ label: "All", value: 10 }]} title="Everything" />);
    const paths = container.querySelectorAll('path[data-rebar-part="slice"]');
    expect(paths).toHaveLength(1);
    // A full-circle slice can't share a start and end point in a single SVG arc command — the
    // path's own "d" must therefore contain a real arc command rather than collapsing to a point.
    expect(paths[0]?.getAttribute("d")).toMatch(/A /);
    expect(screen.getByText("All (100%)")).toBeInTheDocument();
  });

  it("renders a donut hole via innerRadiusRatio as a two-arc path", () => {
    const { container } = render(<PieChart slices={slices} innerRadiusRatio={0.6} title="Donut" />);
    const paths = container.querySelectorAll('path[data-rebar-part="slice"]');
    // A donut slice's path has an outer arc AND an inner arc (two "A" commands), unlike a solid
    // pie slice's single outer arc plus a straight line back to center.
    paths.forEach((p) => {
      expect((p.getAttribute("d")?.match(/A /g) ?? []).length).toBe(2);
    });
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<PieChart slices={slices} title="Traffic sources" />);
    expect(container.querySelector('[data-rebar-component="pie-chart"]')).toBeInTheDocument();
  });
});
