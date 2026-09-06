import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Menubar } from "../components/Menubar";
import type { MenubarMenu } from "../components/Menubar";

afterEach(cleanup);

function makeMenus(onSelect: (label: string) => void, disabledOnSelect: () => void): MenubarMenu[] {
  return [
    {
      label: "File",
      items: [
        { key: "new", label: "New", onSelect: () => onSelect("New") },
        { key: "open", label: "Open", onSelect: () => onSelect("Open") },
        { key: "sep-1", separator: true },
        { key: "exit", label: "Exit", disabled: true, onSelect: disabledOnSelect },
      ],
    },
    {
      label: "Edit",
      items: [
        { key: "cut", label: "Cut", onSelect: () => onSelect("Cut") },
        { key: "copy", label: "Copy", onSelect: () => onSelect("Copy") },
      ],
    },
    {
      label: "View",
      items: [{ key: "zoom", label: "Zoom", onSelect: () => onSelect("Zoom") }],
    },
  ];
}

describe("Menubar", () => {
  it("renders a real menubar role with one menuitem trigger per menu", () => {
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);
    expect(screen.getByRole("menubar")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "View" })).toBeInTheDocument();
  });

  it("only the first trigger is tabbable initially (roving tabindex)", () => {
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);
    expect(screen.getByRole("menuitem", { name: "File" })).toHaveAttribute("tabIndex", "0");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute("tabIndex", "-1");
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute("tabIndex", "-1");
  });

  it("clicking a trigger opens its menu and marks it aria-expanded", async () => {
    const user = userEvent.setup();
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);

    const fileTrigger = screen.getByRole("menuitem", { name: "File" });
    await user.click(fileTrigger);

    expect(await screen.findByRole("menuitem", { name: "New" })).toBeInTheDocument();
    expect(fileTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("ArrowRight/ArrowLeft move roving-tabindex focus between triggers without opening a menu", async () => {
    const user = userEvent.setup();
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);

    const fileTrigger = screen.getByRole("menuitem", { name: "File" });
    const editTrigger = screen.getByRole("menuitem", { name: "Edit" });
    const viewTrigger = screen.getByRole("menuitem", { name: "View" });

    fileTrigger.focus();
    await user.keyboard("{ArrowRight}");
    expect(editTrigger).toHaveFocus();
    expect(editTrigger).toHaveAttribute("tabIndex", "0");
    expect(fileTrigger).toHaveAttribute("tabIndex", "-1");
    expect(screen.queryByRole("menuitem", { name: "Cut" })).not.toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(viewTrigger).toHaveFocus();

    // wraps back around to the first
    await user.keyboard("{ArrowRight}");
    expect(fileTrigger).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(viewTrigger).toHaveFocus();
  });

  it("opening one menu then arrow-keying to an adjacent trigger switches directly to that one's menu", async () => {
    const user = userEvent.setup();
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);

    const fileTrigger = screen.getByRole("menuitem", { name: "File" });
    await user.click(fileTrigger);
    expect(await screen.findByRole("menuitem", { name: "New" })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");

    const editTrigger = screen.getByRole("menuitem", { name: "Edit" });
    expect(editTrigger).toHaveAttribute("aria-expanded", "true");
    // Real focus lands on the newly-opened menu's first item — matching real desktop menu-bar
    // convention (Windows/GTK-style): switching to an adjacent top-level menu via the keyboard
    // opens straight into its content, ready for further Up/Down item navigation, rather than
    // parking focus back on the trigger row.
    expect(await screen.findByRole("menuitem", { name: "Cut" })).toHaveFocus();
    // File's own menu is gone — only one menu open at a time.
    expect(screen.queryByRole("menuitem", { name: "New" })).not.toBeInTheDocument();
    expect(fileTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("hovering an adjacent trigger while a menu is open switches directly to that one's menu", async () => {
    const user = userEvent.setup();
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);

    await user.click(screen.getByRole("menuitem", { name: "File" }));
    expect(await screen.findByRole("menuitem", { name: "New" })).toBeInTheDocument();

    await user.hover(screen.getByRole("menuitem", { name: "View" }));

    expect(await screen.findByRole("menuitem", { name: "Zoom" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "New" })).not.toBeInTheDocument();
  });

  it("Escape closes the open menu and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);

    const fileTrigger = screen.getByRole("menuitem", { name: "File" });
    await user.click(fileTrigger);
    expect(await screen.findByRole("menuitem", { name: "New" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menuitem", { name: "New" })).not.toBeInTheDocument();
    expect(fileTrigger).toHaveFocus();
    expect(fileTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("selecting an item calls its onSelect and closes the menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Menubar items={makeMenus(onSelect, vi.fn())} />);

    await user.click(screen.getByRole("menuitem", { name: "File" }));
    await user.click(await screen.findByRole("menuitem", { name: "Open" }));

    expect(onSelect).toHaveBeenCalledWith("Open");
    expect(screen.queryByRole("menuitem", { name: "New" })).not.toBeInTheDocument();
  });

  it("disabled items don't fire onSelect", async () => {
    const user = userEvent.setup();
    const disabledOnSelect = vi.fn();
    render(<Menubar items={makeMenus(vi.fn(), disabledOnSelect)} />);

    await user.click(screen.getByRole("menuitem", { name: "File" }));
    const exitItem = await screen.findByRole("menuitem", { name: "Exit" });
    expect(exitItem).toHaveAttribute("aria-disabled", "true");
    await user.click(exitItem);

    expect(disabledOnSelect).not.toHaveBeenCalled();
  });

  it("renders a real separator between grouped items", async () => {
    const user = userEvent.setup();
    render(<Menubar items={makeMenus(vi.fn(), vi.fn())} />);
    await user.click(screen.getByRole("menuitem", { name: "File" }));
    await screen.findByRole("menuitem", { name: "New" });
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
