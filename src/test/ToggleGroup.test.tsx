import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleGroup } from "../components/ToggleGroup";
import type { ToggleGroupItem } from "../components/ToggleGroup";

const items: ToggleGroupItem[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

describe("ToggleGroup", () => {
  describe("type=single", () => {
    it("presses only the clicked item, unpressing any previously pressed one", async () => {
      const user = userEvent.setup();
      render(<ToggleGroup type="single" items={items} defaultValue="left" />);
      expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "true");

      await user.click(screen.getByRole("button", { name: "Center" }));
      expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Right" })).toHaveAttribute("aria-pressed", "false");
    });

    it("clicking the already-pressed item clears the selection", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="single" items={items} defaultValue="left" onValueChange={onValueChange} />,
      );
      await user.click(screen.getByRole("button", { name: "Left" }));
      expect(onValueChange).toHaveBeenCalledWith("");
      expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "false");
    });

    it("controlled: only changes when the caller applies onValueChange's value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<ToggleGroup type="single" items={items} value="left" onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button", { name: "Center" }));
      expect(onValueChange).toHaveBeenCalledWith("center");
      // Still "left" — the caller never re-rendered with the new value.
      expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "false");
    });

    it("controlled: reflects whatever value the caller passes down", async () => {
      function Controlled() {
        const [value, setValue] = useState("left");
        return <ToggleGroup type="single" items={items} value={value} onValueChange={setValue} />;
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.click(screen.getByRole("button", { name: "Right" }));
      expect(screen.getByRole("button", { name: "Right" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "false");
    });

    it("disabled item does not fire onValueChange or change state", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const withDisabled: ToggleGroupItem[] = [
        { value: "left", label: "Left" },
        { value: "center", label: "Center", disabled: true },
      ];
      render(<ToggleGroup type="single" items={withDisabled} onValueChange={onValueChange} />);
      const center = screen.getByRole("button", { name: "Center" });
      expect(center).toBeDisabled();
      await user.click(center);
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("type=multiple", () => {
    it("allows more than one item pressed at once", async () => {
      const user = userEvent.setup();
      render(<ToggleGroup type="multiple" items={items} />);
      await user.click(screen.getByRole("button", { name: "Left" }));
      await user.click(screen.getByRole("button", { name: "Right" }));
      expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Right" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "false");
    });

    it("uncontrolled: calls onValueChange with the updated array on toggle", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<ToggleGroup type="multiple" items={items} onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button", { name: "Left" }));
      expect(onValueChange).toHaveBeenCalledWith(["left"]);
      await user.click(screen.getByRole("button", { name: "Left" }));
      expect(onValueChange).toHaveBeenLastCalledWith([]);
    });

    it("controlled: only changes when the caller applies onValueChange's value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="multiple" items={items} value={["left"]} onValueChange={onValueChange} />,
      );
      await user.click(screen.getByRole("button", { name: "Right" }));
      expect(onValueChange).toHaveBeenCalledWith(["left", "right"]);
      expect(screen.getByRole("button", { name: "Right" })).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("keyboard: Space activates a focused item", async () => {
    const user = userEvent.setup();
    render(<ToggleGroup type="single" items={items} />);
    const button = screen.getByRole("button", { name: "Left" });
    button.focus();
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("carries data-rebar-component and data-rebar-toggle-group-type on the root", () => {
    const { container } = render(<ToggleGroup type="multiple" items={items} />);
    const root = container.querySelector('[data-rebar-component="toggle-group"]');
    expect(root).toHaveAttribute("data-rebar-toggle-group-type", "multiple");
  });
});
