import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "../components/Combobox";

afterEach(cleanup);

const OPTIONS = [
  { value: "af", label: "Afghanistan" },
  { value: "al", label: "Albania" },
  { value: "dz", label: "Algeria" },
];

const LANGUAGE_OPTIONS = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
];

describe("Combobox (single-select)", () => {
  it("renders a real combobox input", () => {
    render(<Combobox options={OPTIONS} aria-label="Country" />);
    expect(screen.getByRole("combobox", { name: "Country" })).toBeInTheDocument();
  });

  it("filters the option list as the user types", async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} aria-label="Country" />);
    await user.type(screen.getByRole("combobox", { name: "Country" }), "al");
    expect(screen.getByRole("option", { name: "Albania" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Afghanistan" })).not.toBeInTheDocument();
  });

  it("selects an option via arrow keys and Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={OPTIONS} onValueChange={onValueChange} aria-label="Country" />);
    const input = screen.getByRole("combobox", { name: "Country" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("al");
    expect(input).toHaveValue("Albania");
  });

  it("selects an option via mousedown without losing it to blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={OPTIONS} onValueChange={onValueChange} aria-label="Country" />);
    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "Algeria" }));
    expect(onValueChange).toHaveBeenCalledWith("dz");
  });
});

describe("Combobox (multiple)", () => {
  it("renders selected values as removable chips", () => {
    render(<Combobox multiple options={LANGUAGE_OPTIONS} defaultValues={["ts"]} aria-label="Languages" />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("adds a value on selection, removing it from the remaining option list", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(<Combobox multiple options={LANGUAGE_OPTIONS} onValuesChange={onValuesChange} aria-label="Languages" />);
    await user.click(screen.getByRole("combobox", { name: "Languages" }));
    await user.click(screen.getByRole("option", { name: "TypeScript" }));
    expect(onValuesChange).toHaveBeenCalledWith(["ts"]);
    // The dropdown stays open after a pick — no need to reopen it for the next selection.
    expect(screen.getByRole("option", { name: "JavaScript" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "TypeScript" })).not.toBeInTheDocument();
  });

  it("removes a chip via its close button", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <Combobox
        multiple
        options={LANGUAGE_OPTIONS}
        defaultValues={["ts", "py"]}
        onValuesChange={onValuesChange}
        aria-label="Languages"
      />,
    );
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    expect(onValuesChange).toHaveBeenCalledWith(["py"]);
  });

  it("removes the last chip on Backspace from an empty query", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <Combobox
        multiple
        options={LANGUAGE_OPTIONS}
        defaultValues={["ts", "py"]}
        onValuesChange={onValuesChange}
        aria-label="Languages"
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Languages" }));
    await user.keyboard("{Backspace}");
    expect(onValuesChange).toHaveBeenCalledWith(["ts"]);
  });
});
