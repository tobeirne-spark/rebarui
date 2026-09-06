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
