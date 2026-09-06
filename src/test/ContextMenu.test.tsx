import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextMenu } from "../components/ContextMenu";
import type { ContextMenuItem } from "../components/ContextMenu";

const items: ContextMenuItem[] = [
  { key: "rename", label: "Rename" },
  { key: "sep", separator: true },
  { key: "disabled", label: "Locked", disabled: true },
  { key: "delete", label: "Delete", danger: true },
];

function renderMenu(itemsOverride: ContextMenuItem[] = items, extraProps = {}) {
  return render(
    <ContextMenu items={itemsOverride} {...extraProps}>
      <div data-testid="surface">Right-click me</div>
    </ContextMenu>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ContextMenu", () => {
  it("does not render the menu until a right-click happens", () => {
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("suppresses the browser's own context menu and opens at the cursor position", () => {
    renderMenu();
    const surface = screen.getByTestId("surface");
    const event = fireEvent.contextMenu(surface, { clientX: 120, clientY: 80 });
    // fireEvent returns false when preventDefault() was called.
    expect(event).toBe(false);

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute("data-rebar-part", "menu");
    expect(menu.style.left).toBe("120px");
    expect(menu.style.top).toBe("80px");
  });

  it("clamps the position so the menu never renders off the right/bottom edge", () => {
    renderMenu();
    const surface = screen.getByTestId("surface");
    fireEvent.contextMenu(surface, { clientX: 1000000, clientY: 1000000 });

    const menu = screen.getByRole("menu");
    const left = parseFloat(menu.style.left);
    const top = parseFloat(menu.style.top);
    expect(left).toBeLessThan(window.innerWidth);
    expect(top).toBeLessThan(window.innerHeight);
  });

  it("carries data-rebar-component on the root wrapper and data-rebar-part on items/separator", () => {
    renderMenu();
    const wrapper = screen.getByTestId("surface").closest('[data-rebar-component="context-menu"]');
    expect(wrapper).not.toBeNull();

    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute("data-rebar-part", "item");
    expect(document.querySelector('[data-rebar-part="separator"]')).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-rebar-danger", "true");
  });

  it("calls onSelect and closes the menu when an item is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu([
      { key: "rename", label: "Rename", onSelect },
      { key: "delete", label: "Delete", danger: true },
    ]);
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });

    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not fire onSelect for a disabled item", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu([{ key: "disabled", label: "Locked", disabled: true, onSelect }]);
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });

    const disabledItem = screen.getByRole("menuitem", { name: "Locked" });
    expect(disabledItem).toBeDisabled();
    await user.click(disabledItem);

    expect(onSelect).not.toHaveBeenCalled();
    // A disabled button click doesn't propagate a real click at all, so the menu should still
    // be open — it wasn't dismissed by this no-op interaction.
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderMenu();
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when clicking outside the menu", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ContextMenu items={items}>
          <div data-testid="surface">Right-click me</div>
        </ContextMenu>
        <button type="button">Outside</button>
      </div>,
    );
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on scroll", () => {
    renderMenu();
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.scroll(window);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation between items with real focus", async () => {
    const user = userEvent.setup();
    renderMenu([
      { key: "a", label: "First" },
      { key: "b", label: "Second" },
      { key: "c", label: "Third" },
    ]);
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });

    expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Second" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Third" })).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Second" })).toHaveFocus();
  });

  it("activates the focused item with Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu([{ key: "a", label: "First", onSelect }]);
    fireEvent.contextMenu(screen.getByTestId("surface"), { clientX: 10, clientY: 10 });

    expect(screen.getByRole("menuitem", { name: "First" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports a long-press on touch as the fallback trigger, opened at the touch point", () => {
    renderMenu(items, { longPressDelay: 10 });
    vi.useFakeTimers();
    const surface = screen.getByTestId("surface");

    fireEvent.touchStart(surface, { touches: [{ clientX: 42, clientY: 24 }] });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(menu.style.left).toBe("42px");
    expect(menu.style.top).toBe("24px");
  });

  it("supports controlled open/onOpenChange", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ContextMenu items={items} open={false} onOpenChange={onOpenChange}>
        <div data-testid="surface">Right-click me</div>
      </ContextMenu>,
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    rerender(
      <ContextMenu items={items} open onOpenChange={onOpenChange}>
        <div data-testid="surface">Right-click me</div>
      </ContextMenu>,
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
