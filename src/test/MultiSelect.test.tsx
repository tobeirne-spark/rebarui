import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelect } from "../components/MultiSelect";

afterEach(cleanup);

const OPTIONS = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
];

describe("MultiSelect", () => {
  it("shows the placeholder on the trigger when nothing is selected", () => {
    render(<MultiSelect options={OPTIONS} placeholder="Choose languages" aria-label="Languages" />);
    expect(screen.getByRole("button", { name: "Languages" })).toHaveTextContent("Choose languages");
  });

  it("opens on trigger click and shows real menuitemcheckbox roles", async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={OPTIONS} aria-label="Languages" />);
    await user.click(screen.getByRole("button", { name: "Languages" }));
    expect(await screen.findByRole("menuitemcheckbox", { name: "JavaScript" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "TypeScript" })).toBeInTheDocument();
  });

  it("checks an option and reflects it in the trigger's summary", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(<MultiSelect options={OPTIONS} onValuesChange={onValuesChange} aria-label="Languages" />);

    await user.click(screen.getByRole("button", { name: "Languages" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "TypeScript" }));

    expect(onValuesChange).toHaveBeenCalledWith(["ts"]);
    // The menu stays open across picks (see below) — Radix marks the trigger `aria-hidden` while
    // its menu is open, so it's queried directly rather than via role here.
    expect(document.querySelector('[data-rebar-part="value"]')).toHaveTextContent("TypeScript");
  });

  it("keeps the menu open across multiple picks, rather than closing after the first", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(<MultiSelect options={OPTIONS} onValuesChange={onValuesChange} aria-label="Languages" />);

    await user.click(screen.getByRole("button", { name: "Languages" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "TypeScript" }));
    // Still open — the second option is still reachable without reopening the menu.
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Python" }));

    expect(onValuesChange).toHaveBeenNthCalledWith(1, ["ts"]);
    expect(onValuesChange).toHaveBeenNthCalledWith(2, ["ts", "py"]);
  });

  it("unchecks an already-selected option", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <MultiSelect
        options={OPTIONS}
        defaultValues={["ts", "py"]}
        onValuesChange={onValuesChange}
        aria-label="Languages"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Languages" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "TypeScript" }));

    expect(onValuesChange).toHaveBeenCalledWith(["py"]);
  });

  it("works as a controlled component via values/onValuesChange", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(<MultiSelect options={OPTIONS} values={["js"]} onValuesChange={onValuesChange} aria-label="Languages" />);

    expect(screen.getByRole("button", { name: "Languages" })).toHaveTextContent("JavaScript");

    await user.click(screen.getByRole("button", { name: "Languages" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "TypeScript" }));

    expect(onValuesChange).toHaveBeenCalledWith(["js", "ts"]);
    // Controlled: the trigger doesn't update its own display until the parent passes new
    // `values` — queried directly since the still-open menu marks the trigger `aria-hidden`.
    expect(document.querySelector('[data-rebar-part="value"]')).toHaveTextContent("JavaScript");
  });
});
