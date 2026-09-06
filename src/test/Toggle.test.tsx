import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "../components/Toggle";

describe("Toggle", () => {
  it("renders as a real button carrying data-rebar-component and no pressed state by default", () => {
    render(<Toggle>Bold</Toggle>);
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("data-rebar-component", "toggle");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toHaveAttribute("data-rebar-pressed");
  });

  it("uncontrolled: a click flips aria-pressed and data-rebar-pressed", async () => {
    const user = userEvent.setup();
    render(<Toggle>Bold</Toggle>);
    const button = screen.getByRole("button", { name: "Bold" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("data-rebar-pressed", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toHaveAttribute("data-rebar-pressed");
  });

  it("uncontrolled: defaultPressed sets the initial state", () => {
    render(<Toggle defaultPressed>Bold</Toggle>);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  });

  it("uncontrolled: calls onPressedChange with the next state on click", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("controlled: pressed state only changes if the caller applies onPressedChange's value", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    // pressed is fixed at false; the component must not flip it on its own.
    render(
      <Toggle pressed={false} onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );
    const button = screen.getByRole("button", { name: "Bold" });
    await user.click(button);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    // Still false — the caller never re-rendered with the new value.
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("controlled: reflects whatever pressed value the caller passes down", async () => {
    function Controlled() {
      const [pressed, setPressed] = useState(false);
      return (
        <Toggle pressed={pressed} onPressedChange={setPressed}>
          Bold
        </Toggle>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("data-rebar-pressed", "true");
  });

  it("disabled: does not fire onPressedChange or flip state on click", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        Bold
      </Toggle>,
    );
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("keyboard: Enter activates the toggle", async () => {
    const user = userEvent.setup();
    render(<Toggle>Bold</Toggle>);
    const button = screen.getByRole("button", { name: "Bold" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("keyboard: Space activates the toggle", async () => {
    const user = userEvent.setup();
    render(<Toggle>Bold</Toggle>);
    const button = screen.getByRole("button", { name: "Bold" });
    button.focus();
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("forwards an explicit aria-label for icon-only usage", () => {
    render(<Toggle aria-label="Bold">B</Toggle>);
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("forwards arbitrary data-* and aria-* props to the root button", () => {
    render(
      <Toggle data-testid="bold-toggle" aria-describedby="hint">
        Bold
      </Toggle>,
    );
    const button = screen.getByTestId("bold-toggle");
    expect(button).toHaveAttribute("aria-describedby", "hint");
  });

  it("defaults to size md and reflects a custom size on data-rebar-size", () => {
    const { rerender } = render(<Toggle>Bold</Toggle>);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-rebar-size", "md");
    rerender(<Toggle size="lg">Bold</Toggle>);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-rebar-size", "lg");
  });
});
