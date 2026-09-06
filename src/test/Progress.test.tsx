import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "../components/Progress";

describe("Progress", () => {
  it("renders a real progressbar role reflecting the value", () => {
    render(<Progress value={40} aria-label="Upload progress" />);
    const progress = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(progress).toHaveAttribute("aria-valuenow", "40");
    expect(progress).toHaveAttribute("data-rebar-component", "progress");
  });

  it("translates the indicator proportionally to value/max", () => {
    const { container } = render(<Progress value={25} max={50} />);
    const indicator = container.querySelector('[data-rebar-part="indicator"]') as HTMLElement;
    expect(indicator.style.transform).toBe("translateX(-50%)");
  });
});
