import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../components/Badge";

describe("Badge", () => {
  it("renders a count indicator overlaid on children", () => {
    const { container } = render(
      <Badge count={5}>
        <span>Inbox</span>
      </Badge>,
    );
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-component="badge"]')).toBeInTheDocument();
  });

  it("caps the label at max with a plus suffix", () => {
    render(
      <Badge count={150} max={99}>
        <span>Inbox</span>
      </Badge>,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides the indicator when count is zero and showZero is false", () => {
    render(
      <Badge count={0}>
        <span>Inbox</span>
      </Badge>,
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows zero when showZero is set", () => {
    render(
      <Badge count={0} showZero>
        <span>Inbox</span>
      </Badge>,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders a standalone dot indicator with no children", () => {
    const { container } = render(<Badge dot />);
    const indicator = container.querySelector('[data-rebar-component="badge"]');
    expect(indicator).toHaveClass("rebar-badge-dot");
  });

  it("renders an emoji as the indicator's content via the content prop, overriding count", () => {
    render(
      <Badge content="🔥" count={5}>
        <span>Inbox</span>
      </Badge>,
    );
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("shows content-mode indicators even with no count/dot/showZero given", () => {
    const { container } = render(
      <Badge content="⭐">
        <span>Starred item</span>
      </Badge>,
    );
    expect(screen.getByText("⭐")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="indicator"]')).toBeInTheDocument();
  });

  it("supports a standalone content-only badge with no wrapped children", () => {
    render(<Badge content="🔥" />);
    expect(screen.getByText("🔥")).toBeInTheDocument();
  });
});
