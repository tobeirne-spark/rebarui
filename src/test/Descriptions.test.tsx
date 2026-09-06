import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Descriptions } from "../components/Descriptions";

describe("Descriptions", () => {
  const items = [
    { label: "Team", value: "Engineering" },
    { label: "Lead", value: "Priya Shah" },
  ];

  it("renders each item as a real label/value pair", () => {
    render(<Descriptions items={items} />);
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
  });

  it("renders an optional title", () => {
    render(<Descriptions title="Project details" items={items} />);
    expect(screen.getByText("Project details")).toBeInTheDocument();
  });

  it("applies the column count to the grid", () => {
    const { container } = render(<Descriptions items={items} column={2} />);
    const grid = container.querySelector(".rebar-descriptions-grid") as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });
});
