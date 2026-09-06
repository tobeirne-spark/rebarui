import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline } from "../components/Timeline";

describe("Timeline", () => {
  it("renders each item's content in order", () => {
    render(
      <Timeline
        items={[
          { label: "2026-01-01", children: "Order placed" },
          { label: "2026-01-03", children: "Shipped" },
        ]}
      />,
    );
    const list = screen.getByRole("list");
    expect(list.textContent).toMatch(/Order placed.*Shipped/s);
  });

  it("reflects a per-item tone", () => {
    const { container } = render(<Timeline items={[{ children: "Payment failed", tone: "error" }]} />);
    expect(container.querySelector('[data-rebar-part="item"]')).toHaveAttribute(
      "data-rebar-tone",
      "error",
    );
  });

  it("defaults to the default tone when none is given", () => {
    const { container } = render(<Timeline items={[{ children: "Order placed" }]} />);
    expect(container.querySelector('[data-rebar-part="item"]')).toHaveAttribute(
      "data-rebar-tone",
      "default",
    );
  });
});
