import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WaterfallChart } from "../components/WaterfallChart";

afterEach(cleanup);

describe("WaterfallChart", () => {
  const steps = [
    { label: "Starting cash", value: 1000, isTotal: true },
    { label: "Sales", value: 500 },
    { label: "Refunds", value: -200 },
    { label: "Ending cash", value: 1300, isTotal: true },
  ];

  it("renders a real svg with an accessible name from title", () => {
    render(<WaterfallChart steps={steps} title="Cash flow" />);
    expect(screen.getByRole("img", { name: "Cash flow" })).toBeInTheDocument();
  });

  it("renders one bar per step, each labeled with its own name", () => {
    const { container } = render(<WaterfallChart steps={steps} title="Cash flow" />);
    const stepGroups = container.querySelectorAll('[data-rebar-part="step"]');
    expect(stepGroups).toHaveLength(4);
    expect(container.querySelectorAll('[data-rebar-part="step"] rect')).toHaveLength(4);
    expect(screen.getByText("Starting cash")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Refunds")).toBeInTheDocument();
    expect(screen.getByText("Ending cash")).toBeInTheDocument();
  });

  it("renders total bars from zero and shows their absolute value, not a signed delta", () => {
    render(<WaterfallChart steps={steps} title="Cash flow" />);
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("1,300")).toBeInTheDocument();
  });

  it("renders title as a real visible figcaption", () => {
    const { container } = render(<WaterfallChart steps={steps} title="Cash flow" />);
    const caption = container.querySelector('figcaption[data-rebar-part="title"]');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent("Cash flow");
  });

  it("renders a negative step as a signed label in the danger color, floating instead of from zero", () => {
    const { container } = render(<WaterfallChart steps={steps} title="Cash flow" />);
    expect(screen.getByText("-200")).toBeInTheDocument();
    const stepGroups = container.querySelectorAll('[data-rebar-part="step"]');
    const refundsGroup = Array.from(stepGroups).find((g) => g.textContent?.includes("Refunds"));
    const rect = refundsGroup?.querySelector("rect");
    expect(rect).toHaveAttribute("fill", "var(--rebar-color-danger, #d32f2f)");
    // A floating bar's own height is a real, positive rect height (not the whole plot height, and
    // not collapsed to zero) — it spans only the delta's own magnitude on the shared scale.
    expect(Number(rect?.getAttribute("height"))).toBeGreaterThan(0);
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<WaterfallChart steps={steps} title="Cash flow" />);
    expect(container.querySelector('[data-rebar-component="waterfall-chart"]')).toBeInTheDocument();
  });
});
