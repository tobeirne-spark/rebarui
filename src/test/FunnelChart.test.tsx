import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FunnelChart } from "../components/FunnelChart";

afterEach(cleanup);

describe("FunnelChart", () => {
  const stages = [
    { label: "Visitors", value: 1000, color: "#1565c0" },
    { label: "Signups", value: 400, color: "#2e7d32" },
    { label: "Purchases", value: 120, color: "#f57c00" },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<FunnelChart stages={stages} title="Conversion funnel" />);
    expect(screen.getByRole("img", { name: "Conversion funnel" })).toBeInTheDocument();
  });

  it("renders one stage group per stage, each labeled with its name and value", () => {
    const { container } = render(<FunnelChart stages={stages} title="Conversion funnel" />);
    expect(container.querySelectorAll('[data-rebar-part="stage"]')).toHaveLength(3);
    expect(screen.getByText("Visitors")).toBeInTheDocument();
    expect(screen.getByText("Signups")).toBeInTheDocument();
    expect(screen.getByText("Purchases")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("renders title as a real visible figcaption", () => {
    const { container } = render(<FunnelChart stages={stages} title="Conversion funnel" />);
    const caption = container.querySelector('figcaption[data-rebar-part="title"]');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Conversion funnel");
  });

  it("handles a zero-value stage as a degenerate (pointed) but still-rendered shape", () => {
    const zeroStages = [
      { label: "Visitors", value: 1000 },
      { label: "Signups", value: 0 },
      { label: "Purchases", value: 0 },
    ];
    const { container } = render(<FunnelChart stages={zeroStages} title="No conversions" />);
    const stageGroups = container.querySelectorAll('[data-rebar-part="stage"]');
    expect(stageGroups).toHaveLength(3);
    // "0" appears for both zero-value stages' own value labels.
    expect(screen.getAllByText("0")).toHaveLength(2);
    // Every stage still gets a real, non-empty path — no crash or blank shape from a 0/0 ratio.
    stageGroups.forEach((g) => {
      const d = g.querySelector("path")?.getAttribute("d");
      expect(d).toBeTruthy();
    });
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<FunnelChart stages={stages} title="Conversion funnel" />);
    expect(container.querySelector('[data-rebar-component="funnel-chart"]')).toBeInTheDocument();
  });
});
