import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ErrorBlock } from "../components/ErrorBlock";

afterEach(cleanup);

describe("ErrorBlock", () => {
  it("renders the default status's default title/description", () => {
    render(<ErrorBlock />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
  });

  it("renders each non-empty status's own default copy", () => {
    const { rerender } = render(<ErrorBlock status="disconnected" />);
    expect(screen.getByText("No connection")).toBeInTheDocument();

    rerender(<ErrorBlock status="busy" />);
    expect(screen.getByText("Servers are busy")).toBeInTheDocument();
  });

  it("status='empty' composes the real Empty component", () => {
    const { container } = render(<ErrorBlock status="empty" />);
    expect(container.querySelector("[data-rebar-component='empty']")).toBeInTheDocument();
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("overriding title/description replaces the default copy", () => {
    render(<ErrorBlock status="disconnected" title="Custom title" description="Custom description" />);
    expect(screen.getByText("Custom title")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
    expect(screen.queryByText("No connection")).not.toBeInTheDocument();
  });

  it("renders children as a real action area below the description", () => {
    render(
      <ErrorBlock status="default">
        <button type="button">Retry</button>
      </ErrorBlock>,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component/data-rebar-status attributes", () => {
    const { container } = render(<ErrorBlock status="busy" />);
    const root = container.querySelector("[data-rebar-component='error-block']");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-rebar-status", "busy");
  });

  it("fullPage widens the icon via a modifier class", () => {
    const { container } = render(<ErrorBlock fullPage />);
    expect(container.querySelector(".rebar-error-block-full-page")).toBeInTheDocument();
  });
});
