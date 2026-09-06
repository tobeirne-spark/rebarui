import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cascader } from "../components/Cascader";

afterEach(cleanup);

const OPTIONS = [
  {
    value: "on",
    label: "Ontario",
    children: [
      { value: "toronto", label: "Toronto" },
      { value: "ottawa", label: "Ottawa" },
    ],
  },
  {
    value: "bc",
    label: "British Columbia",
    children: [{ value: "vancouver", label: "Vancouver" }],
  },
];

describe("Cascader", () => {
  it("renders a single level (province) until a selection reveals the next one", () => {
    render(<Cascader options={OPTIONS} aria-label="Location" />);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("reveals the next level after selecting a value, scoped to that option's children", async () => {
    const user = userEvent.setup();
    render(<Cascader options={OPTIONS} aria-label="Location" />);
    await user.click(screen.getByRole("combobox", { name: "Location, level 1" }));
    await user.click(await screen.findByRole("option", { name: "Ontario" }));

    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    await user.click(screen.getByRole("combobox", { name: "Location, level 2" }));
    expect(await screen.findByRole("option", { name: "Toronto" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Vancouver" })).not.toBeInTheDocument();
  });

  it("calls onValueChange with the full path and labels, and clears deeper levels on a new top-level choice", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Cascader options={OPTIONS} onValueChange={onValueChange} aria-label="Location" />);
    await user.click(screen.getByRole("combobox", { name: "Location, level 1" }));
    await user.click(await screen.findByRole("option", { name: "Ontario" }));
    await user.click(screen.getByRole("combobox", { name: "Location, level 2" }));
    await user.click(await screen.findByRole("option", { name: "Toronto" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["on", "toronto"], ["Ontario", "Toronto"]);

    await user.click(screen.getByRole("combobox", { name: "Location, level 1" }));
    await user.click(await screen.findByRole("option", { name: "British Columbia" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["bc"], ["British Columbia"]);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });
});
