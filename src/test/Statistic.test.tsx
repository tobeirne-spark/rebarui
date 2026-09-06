import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Statistic } from "../components/Statistic";

describe("Statistic", () => {
  it("renders a title and a formatted numeric value", () => {
    render(<Statistic title="Active users" value={1234} />);
    expect(screen.getByText("Active users")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("applies fixed precision to a numeric value", () => {
    render(<Statistic value={9.8765} precision={2} />);
    expect(screen.getByText("9.88")).toBeInTheDocument();
  });

  it("passes a string value through unformatted", () => {
    render(<Statistic value="N/A" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders prefix and suffix around the value", () => {
    render(<Statistic value={99} prefix="$" suffix="%" />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });
});
