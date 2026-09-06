import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../components/Select";

const OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

describe("Select", () => {
  it("renders a trigger with the placeholder when nothing is selected", () => {
    render(<Select options={OPTIONS} placeholder="Choose a size" aria-label="Size" />);
    expect(screen.getByRole("combobox", { name: "Size" })).toHaveTextContent("Choose a size");
  });

  it("carries data-rebar-component on the trigger", () => {
    render(<Select options={OPTIONS} aria-label="Size" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("data-rebar-component", "select");
  });

  it("opens the listbox and selects an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={OPTIONS} aria-label="Size" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Size" }));
    const option = await screen.findByRole("option", { name: "Medium" });
    await user.click(option);

    expect(onValueChange).toHaveBeenCalledWith("md");
  });
});
