import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StackedBarChart } from "../components/StackedBarChart";

afterEach(cleanup);

describe("StackedBarChart", () => {
  const bars = [
    {
      label: "Hire developers",
      segments: [
        { label: "Build", value: 16800, color: "#1565c0" },
        { label: "Revisions", value: 16800, color: "#1e88e5" },
      ],
    },
    {
      label: "AI-assisted",
      segments: [{ label: "API cost", value: 100, color: "#1b5e20" }],
    },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<StackedBarChart bars={bars} title="Cost composition" />);
    expect(screen.getByRole("img", { name: "Cost composition" })).toBeInTheDocument();
  });

  it("renders one rect per segment and a total label per bar", () => {
    const { container } = render(<StackedBarChart bars={bars} title="Cost composition" />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    expect(screen.getByText("$33,600")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("renders each bar's own label", () => {
    render(<StackedBarChart bars={bars} title="Cost composition" />);
    expect(screen.getByText("Hire developers")).toBeInTheDocument();
    expect(screen.getByText("AI-assisted")).toBeInTheDocument();
  });

  it("picks a readable label color against a dark vs. light segment fill", () => {
    const { container } = render(
      <StackedBarChart
        bars={[
          {
            label: "Bar",
            segments: [
              { label: "Dark", value: 100, color: "#000000" },
              { label: "Light", value: 100, color: "#ffffff" },
            ],
          },
        ]}
        title="Contrast check"
      />,
    );
    const segmentLabels = Array.from(container.querySelectorAll("text")).filter((el) =>
      el.textContent?.includes("($100)"),
    );
    expect(segmentLabels).toHaveLength(2);
    expect(segmentLabels[0]).toHaveAttribute("fill", "#ffffff");
    expect(segmentLabels[1]).toHaveAttribute("fill", "#212121");
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<StackedBarChart bars={bars} title="Cost composition" />);
    expect(container.querySelector('[data-rebar-component="stacked-bar-chart"]')).toBeInTheDocument();
  });

  const sharedSegmentBars = [
    {
      label: "Q1",
      segments: [
        { label: "Engineering", value: 200 },
        { label: "Marketing", value: 100 },
      ],
    },
    {
      label: "Q2",
      segments: [
        { label: "Engineering", value: 250 },
        { label: "Marketing", value: 150 },
      ],
    },
  ];

  it("omits the filter footer entirely unless filterable is set", () => {
    const { container } = render(<StackedBarChart bars={sharedSegmentBars} title="Spend by quarter" />);
    expect(container.querySelector('[data-rebar-part="chart-filters"]')).not.toBeInTheDocument();
  });

  it("toggling a segment label off drops it from every bar it appears in, not just one", () => {
    const { container } = render(<StackedBarChart bars={sharedSegmentBars} title="Spend by quarter" filterable />);
    expect(container.querySelectorAll("rect")).toHaveLength(4); // 2 bars x 2 segments

    fireEvent.click(screen.getByRole("button", { name: "Engineering" }));
    // Marketing segment remains in both bars; Engineering is gone from both.
    expect(container.querySelectorAll("rect")).toHaveLength(2);
    expect(screen.queryByText(/\(\$200\)|\(\$250\)/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Engineering" }));
    expect(container.querySelectorAll("rect")).toHaveLength(4);
  });

  it("shows the empty state (with a still-usable filter footer) when every segment is toggled off", () => {
    const { container } = render(<StackedBarChart bars={sharedSegmentBars} title="Spend by quarter" filterable />);
    fireEvent.click(screen.getByRole("button", { name: "Engineering" }));
    fireEvent.click(screen.getByRole("button", { name: "Marketing" }));

    expect(container.querySelector('[data-rebar-component="empty"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Engineering" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Engineering" }));
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(0);
  });
});
