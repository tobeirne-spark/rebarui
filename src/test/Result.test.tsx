import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Result } from "../components/Result";

describe("Result", () => {
  it("renders a title and defaults to the info status", () => {
    const { container } = render(<Result title="Something happened" />);
    expect(screen.getByText("Something happened")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-component="result"]')).toHaveAttribute(
      "data-rebar-status",
      "info",
    );
  });

  it("reflects the status prop", () => {
    const { container } = render(<Result status="success" title="Payment complete" />);
    expect(container.querySelector('[data-rebar-component="result"]')).toHaveAttribute(
      "data-rebar-status",
      "success",
    );
  });

  it("renders an optional subtitle and extra actions", () => {
    render(
      <Result
        title="Payment failed"
        subTitle="Please check your card details."
        extra={<button>Retry</button>}
      />,
    );
    expect(screen.getByText("Please check your card details.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
