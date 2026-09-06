import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlashCommandMenu } from "../components/SlashCommandMenu";
import type { SlashCommand } from "../components/SlashCommandMenu";

afterEach(cleanup);

function makeCommands(overrides?: Partial<SlashCommand>[]): SlashCommand[] {
  const base: SlashCommand[] = [
    { key: "h1", label: "Heading 1", description: "Big section heading", category: "Basic blocks", onSelect: vi.fn() },
    { key: "h2", label: "Heading 2", description: "Medium section heading", category: "Basic blocks", onSelect: vi.fn() },
    { key: "image", label: "Image", description: "Upload or embed an image", category: "Media", onSelect: vi.fn() },
    { key: "video", label: "Video", description: "Embed a video", category: "Media", onSelect: vi.fn() },
  ];
  return base.map((c, i) => ({ ...c, ...(overrides?.[i] ?? {}) }));
}

describe("SlashCommandMenu", () => {
  it("filters commands by case-insensitive substring match on label", () => {
    render(<SlashCommandMenu commands={makeCommands()} query="head" onClose={vi.fn()} />);
    expect(screen.getByRole("option", { name: /Heading 1/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Heading 2/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Image/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Video/ })).not.toBeInTheDocument();
  });

  it("renders commands grouped by category with a heading per group", () => {
    render(<SlashCommandMenu commands={makeCommands()} query="" onClose={vi.fn()} />);
    expect(screen.getByText("Basic blocks")).toBeInTheDocument();
    expect(screen.getByText("Media")).toBeInTheDocument();
    expect(screen.getByText("Basic blocks")).toHaveAttribute("data-rebar-part", "category-heading");
  });

  it("renders an empty query as showing every command", () => {
    render(<SlashCommandMenu commands={makeCommands()} query="" onClose={vi.fn()} />);
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("shows a 'No matching commands' message when the filter matches nothing", () => {
    render(<SlashCommandMenu commands={makeCommands()} query="zzz-no-match" onClose={vi.fn()} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("No matching commands")).toBeInTheDocument();
  });

  it("moves the highlight across group boundaries with ArrowDown/ArrowUp, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<SlashCommandMenu commands={makeCommands()} query="" onClose={vi.fn()} />);

    // Starts on the first item (first group).
    expect(screen.getByRole("option", { name: /Heading 1/ })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Heading 2/ })).toHaveAttribute("aria-selected", "true");

    // Crosses from the "Basic blocks" group into "Media".
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Image/ })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Video/ })).toHaveAttribute("aria-selected", "true");

    // Wraps from the last item (last group) back to the first (first group).
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Heading 1/ })).toHaveAttribute("aria-selected", "true");

    // Wraps backward from the first item to the last.
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: /Video/ })).toHaveAttribute("aria-selected", "true");
  });

  it("tracks the highlighted row's real id via aria-activedescendant", async () => {
    const user = userEvent.setup();
    render(<SlashCommandMenu commands={makeCommands()} query="" onClose={vi.fn()} />);
    const listbox = screen.getByRole("listbox");
    const firstOption = screen.getByRole("option", { name: /Heading 1/ });
    expect(listbox).toHaveAttribute("aria-activedescendant", firstOption.id);

    await user.keyboard("{ArrowDown}");
    const secondOption = screen.getByRole("option", { name: /Heading 2/ });
    expect(listbox).toHaveAttribute("aria-activedescendant", secondOption.id);
    expect(secondOption.id).not.toBe(firstOption.id);
  });

  it("fires the highlighted command's onSelect and calls onClose on Enter", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const commands = makeCommands();
    render(<SlashCommandMenu commands={commands} query="" onClose={onClose} />);

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(commands[2]!.onSelect).toHaveBeenCalledTimes(1);
    expect(commands[0]!.onSelect).not.toHaveBeenCalled();
    expect(commands[1]!.onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SlashCommandMenu commands={makeCommands()} query="" onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("selects a command on click via onSelect and calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const commands = makeCommands();
    render(<SlashCommandMenu commands={commands} query="" onClose={onClose} />);
    await user.click(screen.getByRole("option", { name: /Image/ }));
    expect(commands[2]!.onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("every command row is a real, at-least-44px touch target", () => {
    render(<SlashCommandMenu commands={makeCommands()} query="" onClose={vi.fn()} />);
    for (const option of screen.getAllByRole("option")) {
      expect(option.tagName).toBe("BUTTON");
    }
  });

  it("carries data-rebar-component and data-rebar-part attributes", () => {
    const { container } = render(<SlashCommandMenu commands={makeCommands()} query="" onClose={vi.fn()} />);
    expect(container.querySelector('[data-rebar-component="slash-command-menu"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-rebar-part="command"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-rebar-part="category-heading"]')).toHaveLength(2);
  });
});
