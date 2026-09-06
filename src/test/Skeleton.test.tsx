import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "../components/Skeleton";

describe("Skeleton", () => {
  it("renders the requested number of text lines, hidden from assistive tech", () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const group = container.querySelector('[data-rebar-component="skeleton"]');
    expect(group).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll('[data-rebar-part="line"]')).toHaveLength(3);
  });

  it("shrinks the last line's width when there's more than one", () => {
    const { container } = render(<Skeleton variant="text" lines={2} />);
    const lines = container.querySelectorAll('[data-rebar-part="line"]');
    expect((lines[1] as HTMLElement).style.width).toBe("60%");
  });

  it("renders a single shape for avatar/button/rect variants", () => {
    const { container } = render(<Skeleton variant="avatar" />);
    const el = container.querySelector('[data-rebar-component="skeleton"]');
    expect(el).toHaveAttribute("data-rebar-variant", "avatar");
    expect(el).toHaveClass("rebar-skeleton-avatar");
  });

  it("omits the pulse animation class when active is false", () => {
    const { container } = render(<Skeleton variant="rect" active={false} />);
    expect(container.querySelector('[data-rebar-component="skeleton"]')).not.toHaveClass(
      "rebar-skeleton-active",
    );
  });
});
