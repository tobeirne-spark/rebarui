import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../components/Button";

describe("Button", () => {
  it("renders as a real button with an accessible role and name", () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("carries the data-rebar-* structural attributes", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-rebar-component", "button");
    expect(button).toHaveAttribute("data-rebar-variant", "destructive");
    expect(button).toHaveAttribute("data-rebar-size", "lg");
  });

  it("is keyboard-operable: Tab focuses it, Enter activates it", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);

    await user.tab();
    expect(screen.getByRole("button", { name: "Submit" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables and marks itself busy while loading, preventing double-submit", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Submit
      </Button>,
    );
    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-rebar-state", "loading");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a real currentColor-inheriting vector spinner, not a static emoji glyph", () => {
    const { container } = render(<Button loading>Submit</Button>);
    expect(container.querySelector('[data-rebar-component="spin"]')).toBeInTheDocument();
    const icon = container.querySelector(".rebar-spin-icon-classic");
    expect(icon).toBeInTheDocument();
    // Every stroke on the vector spinner uses currentColor, so it always matches whatever text
    // color CSS resolves for this specific button variant — never a hardcoded, possibly
    // same-as-background color regardless of variant.
    for (const path of icon!.querySelectorAll("circle, path")) {
      expect(path).toHaveAttribute("stroke", "currentColor");
    }
  });

  it("forwards arbitrary data-* and aria-* attributes to the root node", () => {
    render(
      <Button data-testid="confirm-delete-btn" aria-describedby="warning">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-testid", "confirm-delete-btn");
    expect(button).toHaveAttribute("aria-describedby", "warning");
  });
});
