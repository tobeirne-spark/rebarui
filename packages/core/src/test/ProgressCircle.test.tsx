import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProgressCircle } from "../components/ProgressCircle";

afterEach(cleanup);

describe("ProgressCircle", () => {
  it("exposes percent via real progressbar ARIA attributes", () => {
    render(<ProgressCircle percent={72} />);
    const el = screen.getByRole("progressbar");
    expect(el).toHaveAttribute("aria-valuenow", "72");
    expect(el).toHaveAttribute("aria-valuemin", "0");
    expect(el).toHaveAttribute("aria-valuemax", "100");
    expect(el).toHaveAttribute("aria-label", "72%");
  });

  it("clamps out-of-range percentages", () => {
    const { rerender } = render(<ProgressCircle percent={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressCircle percent={-20} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("renders centered label content", () => {
    render(<ProgressCircle percent={50}>50%</ProgressCircle>);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("an explicit ariaLabel overrides the default percentage label", () => {
    render(<ProgressCircle percent={40} ariaLabel="Upload progress" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Upload progress");
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<ProgressCircle percent={10} />);
    expect(container.querySelector("[data-rebar-component='progress-circle']")).toBeInTheDocument();
  });
});
