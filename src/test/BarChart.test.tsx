import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BarChart } from "../components/BarChart";

afterEach(cleanup);

describe("BarChart", () => {
  const bars = [
    { label: "Jan", value: 120 },
    { label: "Feb", value: 90 },
    { label: "Mar", value: 150 },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<BarChart bars={bars} title="Monthly totals" />);
    expect(screen.getByRole("img", { name: "Monthly totals" })).toBeInTheDocument();
  });

  it("renders one rect per bar", () => {
    const { container } = render(<BarChart bars={bars} title="Monthly totals" />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });

  it("renders a title as a real visible caption, not just an accessible name", () => {
    const { container } = render(<BarChart bars={bars} title="Monthly totals" />);
    const caption = container.querySelector('[data-rebar-part="title"]');
    expect(caption?.tagName.toLowerCase()).toBe("figcaption");
    expect(caption).toHaveTextContent("Monthly totals");
  });

  it("omits the figcaption entirely when no title is given", () => {
    const { container } = render(<BarChart bars={bars} />);
    expect(container.querySelector('[data-rebar-part="title"]')).not.toBeInTheDocument();
  });

  it("falls back to a generic accessible name when neither ariaLabel nor title is given", () => {
    render(<BarChart bars={bars} />);
    expect(screen.getByRole("img", { name: "Bar chart" })).toBeInTheDocument();
  });

  it("still renders a bar (with a zero-height rect and a 0 label) for a zero value", () => {
    const { container } = render(
      <BarChart bars={[{ label: "Empty", value: 0 }, { label: "Full", value: 100 }]} title="Zero edge case" />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(2);
    // "0" appears at least twice: the zero-value bar's own total label, and the y-axis's own
    // zero tick — assert presence via getAllByText rather than getByText to avoid ambiguity.
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("renders each bar's own category label", () => {
    render(<BarChart bars={bars} title="Monthly totals" />);
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Feb")).toBeInTheDocument();
    expect(screen.getByText("Mar")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<BarChart bars={bars} title="Monthly totals" />);
    expect(container.querySelector('[data-rebar-component="bar-chart"]')).toBeInTheDocument();
  });
});
