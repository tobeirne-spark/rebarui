import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "../components/CommandPalette";
import type { CommandPaletteCommand } from "../components/CommandPalette";

afterEach(cleanup);

function makeCommands(overrides?: Partial<CommandPaletteCommand>[]): CommandPaletteCommand[] {
  const base: CommandPaletteCommand[] = [
    { id: "new-file", label: "New File", shortcut: "Ctrl+N", onSelect: vi.fn() },
    { id: "open-file", label: "Open File", shortcut: "Ctrl+O", onSelect: vi.fn() },
    { id: "save-file", label: "Save File", shortcut: "Ctrl+S", onSelect: vi.fn() },
  ];
  return base.map((c, i) => ({ ...c, ...(overrides?.[i] ?? {}) }));
}

describe("CommandPalette", () => {
  it("does not render when closed (uncontrolled)", () => {
    render(<CommandPalette commands={makeCommands()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens uncontrolled via defaultOpen", () => {
    render(<CommandPalette defaultOpen commands={makeCommands()} />);
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-rebar-component", "command-palette");
  });

  it("opens and closes as a controlled component", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open palette</button>
          <CommandPalette
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              onOpenChange(next);
            }}
            commands={makeCommands()}
          />
        </>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open palette" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters commands by substring match as the user types, case-insensitively", async () => {
    const user = userEvent.setup();
    render(<CommandPalette defaultOpen commands={makeCommands()} />);
    const input = screen.getByRole("combobox", { name: "Command palette" });
    await user.type(input, "OPEN");
    expect(screen.getByRole("option", { name: /Open File/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /New File/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Save File/ })).not.toBeInTheDocument();
  });

  it("renders shortcuts alongside each command's label", () => {
    render(<CommandPalette defaultOpen commands={makeCommands()} />);
    expect(screen.getByText("Ctrl+N")).toBeInTheDocument();
  });

  it("moves the highlighted item with ArrowDown/ArrowUp, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<CommandPalette defaultOpen commands={makeCommands()} />);
    const input = screen.getByRole("combobox", { name: "Command palette" });
    await user.click(input);

    // Starts on the first item.
    expect(screen.getByRole("option", { name: /New File/ })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Open File/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /New File/ })).toHaveAttribute("aria-selected", "false");

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: /New File/ })).toHaveAttribute("aria-selected", "true");

    // Wraps from the first item to the last on ArrowUp.
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: /Save File/ })).toHaveAttribute("aria-selected", "true");

    // Wraps from the last item back to the first on ArrowDown.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /New File/ })).toHaveAttribute("aria-selected", "true");
  });

  it("fires the highlighted command's onSelect and closes the palette on Enter", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const commands = makeCommands();
    render(<CommandPalette defaultOpen onOpenChange={onOpenChange} commands={commands} />);
    const input = screen.getByRole("combobox", { name: "Command palette" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(commands[1]!.onSelect).toHaveBeenCalledTimes(1);
    expect(commands[0]!.onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("fires a command's onSelect on click and closes the palette", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const commands = makeCommands();
    render(<CommandPalette defaultOpen onOpenChange={onOpenChange} commands={commands} />);
    await user.click(screen.getByRole("option", { name: /Save File/ }));
    expect(commands[2]!.onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders commands grouped, with a header for each group", () => {
    const commands: CommandPaletteCommand[] = [
      { id: "bold", label: "Bold", group: "Format", onSelect: vi.fn() },
      { id: "italic", label: "Italic", group: "Format", onSelect: vi.fn() },
      { id: "copy", label: "Copy", group: "Edit", onSelect: vi.fn() },
    ];
    render(<CommandPalette defaultOpen commands={commands} />);
    expect(screen.getByText("Format")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Bold/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Copy/ })).toBeInTheDocument();
  });

  it("shows a real empty state when no command matches the query", async () => {
    const user = userEvent.setup();
    render(<CommandPalette defaultOpen commands={makeCommands()} />);
    const input = screen.getByRole("combobox", { name: "Command palette" });
    await user.type(input, "zzzzz");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("No matching commands")).toBeInTheDocument();
  });
});
