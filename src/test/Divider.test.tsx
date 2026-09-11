import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Divider } from "../components/Divider";

describe("Divider", () => {
  it("renders a horizontal separator by default", () => {
    render(<Divider />);
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("data-rebar-component", "divider");
    expect(divider).toHaveAttribute("data-orientation", "horizontal");
    // Per the ARIA spec, horizontal is a separator's default orientation — Radix (correctly)
    // omits aria-orientation entirely in that case, only setting it for the vertical case below.
    expect(divider).not.toHaveAttribute("aria-orientation");
  });

  it("renders vertical when orientation is set", () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("renders inline text between two lines when given children", () => {
    render(<Divider>Or</Divider>);
    expect(screen.getByText("Or")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toHaveAttribute("data-rebar-component", "divider");
  });

  it("forwards arbitrary data-* props onto the root, with and without text", () => {
    const { rerender } = render(<Divider data-rebar-part="label" />);
    expect(screen.getByRole("separator")).toHaveAttribute("data-rebar-part", "label");
    rerender(<Divider data-rebar-part="label">Or</Divider>);
    expect(screen.getByRole("separator")).toHaveAttribute("data-rebar-part", "label");
  });
});
