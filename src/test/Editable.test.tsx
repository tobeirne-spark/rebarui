import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editable } from "../components/Editable";

afterEach(cleanup);

describe("Editable", () => {
  it("reads as a real button showing the current value", () => {
    render(<Editable defaultValue="Project Alpha" aria-label="Project name" />);
    expect(screen.getByRole("button", { name: /Project name/ })).toHaveTextContent("Project Alpha");
  });

  it("becomes a real text input on click, and commits on Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Editable defaultValue="Project Alpha" aria-label="Project name" onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /Project name/ }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Project Beta{Enter}");
    expect(onSubmit).toHaveBeenLastCalledWith("Project Beta");
    expect(screen.getByRole("button", { name: /Project name/ })).toHaveTextContent("Project Beta");
  });

  it("reverts to the value it had before this edit on Escape", async () => {
    const user = userEvent.setup();
    render(<Editable defaultValue="Project Alpha" aria-label="Project name" />);
    await user.click(screen.getByRole("button", { name: /Project name/ }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Discarded");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /Project name/ })).toHaveTextContent("Project Alpha");
  });

  it("shows a placeholder when empty, and can't be activated while disabled", async () => {
    const user = userEvent.setup();
    render(<Editable placeholder="Add a name…" aria-label="Project name" disabled />);
    const button = screen.getByRole("button", { name: /Project name/ });
    expect(button).toHaveTextContent("Add a name…");
    await user.click(button);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
