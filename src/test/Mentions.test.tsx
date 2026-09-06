import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Mentions } from "../components/Mentions";

afterEach(cleanup);

const OPTIONS = [
  { id: "1", label: "Alice" },
  { id: "2", label: "Bob" },
  { id: "3", label: "Alistair" },
];

describe("Mentions", () => {
  it("shows a real filtered dropdown when typing @ plus a partial name", async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} placeholder="Write a note" />);
    const textarea = screen.getByPlaceholderText("Write a note");
    await user.click(textarea);
    await user.type(textarea, "Hey @Al");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alistair" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Bob" })).not.toBeInTheDocument();
  });

  it("never shows the dropdown for plain text with no @", async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} placeholder="Write a note" />);
    const textarea = screen.getByPlaceholderText("Write a note");
    await user.type(textarea, "just some plain text, no trigger here");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selecting an option replaces the partial @word with the full mention and updates value via onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Mentions options={OPTIONS} onValueChange={onValueChange} placeholder="Write a note" />);
    const textarea = screen.getByPlaceholderText("Write a note");
    await user.type(textarea, "Hey @Al");

    await user.click(screen.getByRole("option", { name: "Alice" }));

    expect(onValueChange).toHaveBeenCalledWith("Hey @Alice ");
    expect(textarea).toHaveValue("Hey @Alice ");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape closes an open dropdown without changing the text", async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} placeholder="Write a note" />);
    const textarea = screen.getByPlaceholderText("Write a note");
    await user.type(textarea, "Hey @Al");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(textarea).toHaveValue("Hey @Al");
  });
});
