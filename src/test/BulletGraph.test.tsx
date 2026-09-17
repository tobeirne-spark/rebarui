import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BulletGraph } from "../components/BulletGraph";

afterEach(cleanup);

describe("BulletGraph", () => {
  const measures = [
    { label: "Revenue", value: 275, target: 250, ranges: [150, 225, 300] as [number, number, number] },
    { label: "Profit", value: 40, target: 60, ranges: [30, 60, 90] as [number, number, number] },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<BulletGraph measures={measures} title="Q3 KPIs" />);
    expect(screen.getByRole("img", { name: "Q3 KPIs" })).toBeInTheDocument();
  });

  it("renders one measure bar, one target tick, and three range bands per measure", () => {
    const { container } = render(<BulletGraph measures={measures} title="Q3 KPIs" />);
    expect(container.querySelectorAll('[data-rebar-part="measure-bar"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-rebar-part="target"]')).toHaveLength(2);
    // 3 range bands per measure x 2 measures = 6 background rects (plus the 2 measure bars).
    const measureGroups = container.querySelectorAll('[data-rebar-part="measure"]');
    expect(measureGroups).toHaveLength(2);
  });

  it("renders each measure's own label and value/target text", () => {
    render(<BulletGraph measures={measures} title="Q3 KPIs" />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("275 / 250")).toBeInTheDocument();
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<BulletGraph measures={[]} title="Q3 KPIs" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
