import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
});
