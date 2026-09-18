import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Kanban } from "../components/Kanban";
import type { KanbanCard, KanbanColumn } from "../components/Kanban";

const CARDS: Record<string, KanbanCard> = {
  a: { id: "a", title: "Write spec", tags: ["docs"] },
  b: { id: "b", title: "Build UI", description: "The board itself" },
  c: { id: "c", title: "Ship it" },
};

const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: ["a", "b"] }] },
  { id: "review", title: "Review", sections: [{ id: "review-main", cardIds: [] }] },
  { id: "done", title: "Done", sections: [{ id: "done-main", cardIds: ["c"], limit: 1 }], limit: 2 },
];

function drag(source: Element, target: Element) {
  fireEvent.dragStart(source);
  fireEvent.dragOver(target);
  fireEvent.drop(target);
  fireEvent.dragEnd(source);
}

describe("Kanban", () => {
  it("renders columns, cards, descriptions, and tags", () => {
    render(<Kanban columns={COLUMNS} cards={CARDS} />);
    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Write spec")).toBeInTheDocument();
    expect(screen.getByText("The board itself")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("shows a column's total against its limit", () => {
    render(<Kanban columns={COLUMNS} cards={CARDS} />);
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("moves a card to another column on drag-drop", () => {
    const onChange = vi.fn();
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
    const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
    const targetSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[1]!; // "Review", unlimited
    drag(card, targetSection);
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0];
    expect(next.columns[0].sections[0].cardIds).toEqual(["b"]);
    expect(next.columns[1].sections[0].cardIds).toEqual(["a"]);
  });

  it("rejects a drop past a section's limit", () => {
    const onChange = vi.fn();
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
    const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
    const doneSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[2]!;
    // Done's section limit is already at 1/1 (card "c") — drop should be rejected.
    drag(card, doneSection);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("expands and shows an active border on a valid drop target while dragging over it, clearing on drag-leave", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
    const reviewSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[1]!; // unlimited

    fireEvent.dragStart(card);
    fireEvent.dragEnter(reviewSection);
    expect(reviewSection).toHaveClass("rebar-kanban-section-cards-active");
    expect(reviewSection).toHaveClass("rebar-active-border");

    fireEvent.dragLeave(reviewSection, { relatedTarget: document.body });
    expect(reviewSection).not.toHaveClass("rebar-kanban-section-cards-active");
  });

  it("does not expand a section that's already at its limit", () => {
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
    const doneSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[2]!; // 1/1, full

    fireEvent.dragStart(card);
    fireEvent.dragEnter(doneSection);
    expect(doneSection).not.toHaveClass("rebar-kanban-section-cards-active");
  });

  it("renders a default-variant card via the real Card component, with an inline-editable title", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
    const card = screen.getByText("Write spec").closest('[data-rebar-component="card"]') as HTMLElement;
    expect(card).toBeInTheDocument();

    const title = within(card).getByRole("button", { name: "Title, click to edit" });
    await user.click(title);
    const input = within(card).getByRole("textbox");
    fireEvent.change(input, { target: { value: "Write the spec" } });

    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[onChange.mock.calls.length - 1]![0];
    expect(next.cards.a.title).toBe("Write the spec");
  });

  describe("default-variant card modal", () => {
    it("opens an 'Edit card' modal on double-click, without a color picker", async () => {
      const user = userEvent.setup();
      render(<Kanban columns={COLUMNS} cards={CARDS} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-component="card"]') as HTMLElement;

      await user.dblClick(card);
      expect(screen.getByRole("dialog", { name: "Edit card" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /color/i })).not.toBeInTheDocument();
    });

    it("saves title/description/tag edits made in the modal via onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-component="card"]') as HTMLElement;

      await user.dblClick(card);
      fireEvent.change(screen.getByLabelText("Description"), { target: { value: "New description" } });
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0].cards.a.description).toBe("New description");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens the same modal via a long touch-press, the touch equivalent of double-click", () => {
      vi.useFakeTimers();
      render(<Kanban columns={COLUMNS} cards={CARDS} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-component="card"]') as HTMLElement;

      fireEvent.touchStart(card);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole("dialog", { name: "Edit card" })).toBeInTheDocument();
      vi.useRealTimers();
    });

    it("cancels the long-press if the touch moves before the delay elapses", () => {
      vi.useFakeTimers();
      render(<Kanban columns={COLUMNS} cards={CARDS} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-component="card"]') as HTMLElement;

      fireEvent.touchStart(card);
      fireEvent.touchMove(card);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe("touch drag-and-drop", () => {
    // jsdom doesn't implement elementFromPoint (a real-layout-only API) -- stub it to return
    // whatever element the test wants hit-tested at the touch's current position, the same
    // "polyfill the specific jsdom gap" convention RichTextEditor.test.tsx already uses for
    // execCommand.
    function stubElementFromPoint(el: Element | null) {
      document.elementFromPoint = vi.fn().mockReturnValue(el);
    }

    it("moves a card to another section via touch drag, past the movement threshold", () => {
      const onChange = vi.fn();
      const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
      const reviewSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[1]!; // unlimited
      stubElementFromPoint(reviewSection);

      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 0, clientY: 50 }] }); // past the 10px threshold
      fireEvent.touchEnd(card);

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0]![0];
      expect(next.columns[0].sections[0].cardIds).toEqual(["b"]);
      expect(next.columns[1].sections[0].cardIds).toEqual(["a"]);
    });

    it("does not treat a touch below the movement threshold as a drag", () => {
      const onChange = vi.fn();
      const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
      const reviewSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[1]!;
      stubElementFromPoint(reviewSection);

      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 0, clientY: 3 }] }); // under the threshold
      fireEvent.touchEnd(card);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("rejects a touch-dragged drop past a section's limit, same as mouse drag", () => {
      const onChange = vi.fn();
      const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
      const doneSection = container.querySelectorAll('[data-rebar-part="section-cards"]')[2]!; // 1/1, full
      stubElementFromPoint(doneSection);

      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 0, clientY: 50 }] });
      fireEvent.touchEnd(card);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("reorders columns via a touch drag on the column header", () => {
      const onChange = vi.fn();
      const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
      const headers = container.querySelectorAll('[data-rebar-part="column-header"]');
      const doneColumn = container.querySelectorAll('[data-rebar-part="column"]')[0]!;
      stubElementFromPoint(doneColumn);

      fireEvent.touchStart(headers[2]!, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(headers[2]!, { touches: [{ clientX: 50, clientY: 0 }] });
      fireEvent.touchEnd(headers[2]!);

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0]![0];
      expect(next.columns.map((c: KanbanColumn) => c.id)).toEqual(["done", "todo", "review"]);
    });

    it("calls onCardLongPress instead of opening the built-in edit dialog when provided", () => {
      vi.useFakeTimers();
      const onCardLongPress = vi.fn();
      render(<Kanban columns={COLUMNS} cards={CARDS} onCardLongPress={onCardLongPress} />);
      const card = screen.getByText("Write spec").closest('[data-rebar-component="card"]') as HTMLElement;

      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onCardLongPress).toHaveBeenCalledTimes(1);
      expect(onCardLongPress.mock.calls[0]![0].id).toBe("a");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  it("reorders columns on drag-drop", () => {
    const onChange = vi.fn();
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
    const headers = container.querySelectorAll('[data-rebar-part="column-header"]');
    const doneColumn = container.querySelectorAll('[data-rebar-part="column"]')[0]!;
    drag(headers[2]!, doneColumn);
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0];
    expect(next.columns.map((c: KanbanColumn) => c.id)).toEqual(["done", "todo", "review"]);
  });

  it("adds a card via the inline add-card form", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
    await user.click(screen.getAllByText("+ Add card")[0]!);
    await user.type(screen.getByLabelText("New card title"), "New task");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0];
    expect(next.columns[0].sections[0].cardIds).toHaveLength(3);
    const newCardId = next.columns[0].sections[0].cardIds[2];
    expect(next.cards[newCardId].title).toBe("New task");
  });

  it("disables the add-card button once a section is at its limit", () => {
    render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const buttons = screen.getAllByText("+ Add card");
    expect(buttons[2]).toBeDisabled();
  });

  it("cycles a column's sort order between manual, A→Z, and Z→A", async () => {
    const user = userEvent.setup();
    const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
    const sortButton = screen.getByRole("button", { name: "Sort To do" });
    const todoColumn = container.querySelectorAll('[data-rebar-part="column"]')[0]!;
    const titles = () =>
      Array.from(todoColumn.querySelectorAll(".rebar-card-title")).map((el) => el.textContent);

    expect(titles()).toEqual(["Write spec", "Build UI"]);
    await user.click(sortButton);
    expect(titles()).toEqual(["Build UI", "Write spec"]);
    await user.click(sortButton);
    expect(titles()).toEqual(["Write spec", "Build UI"]);
  });

  it("filters visible cards by the search prop without affecting limit counts", () => {
    render(<Kanban columns={COLUMNS} cards={CARDS} search="write" />);
    expect(screen.getByText("Write spec")).toBeInTheDocument();
    expect(screen.queryByText("Build UI")).not.toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  describe("collapsed columns", () => {
    it("hides its cards and add-card button behind a tray showing the true count, unaffected by search", () => {
      const { container, rerender } = render(<Kanban columns={COLUMNS} cards={CARDS} />);
      const todoColumn = container.querySelectorAll('[data-rebar-part="column"]')[0]!;
      const collapseButton = within(todoColumn as HTMLElement).getByRole("button", { name: "Hide To do cards" });

      fireEvent.click(collapseButton);
      expect(within(todoColumn as HTMLElement).queryByText("Write spec")).not.toBeInTheDocument();
      expect(within(todoColumn as HTMLElement).queryByText("Build UI")).not.toBeInTheDocument();
      expect(within(todoColumn as HTMLElement).queryByText("+ Add card")).not.toBeInTheDocument();
      expect(within(todoColumn as HTMLElement).getByText("2 cards")).toBeInTheDocument();

      // The tray's count is the section's real count, not a search-filtered one.
      rerender(<Kanban columns={COLUMNS} cards={CARDS} search="nothing matches this" />);
      expect(within(todoColumn as HTMLElement).getByText("2 cards")).toBeInTheDocument();
    });

    it("still accepts a dropped card while collapsed, even though it isn't shown", () => {
      const onChange = vi.fn();
      const { container } = render(<Kanban columns={COLUMNS} cards={CARDS} onChange={onChange} />);
      const todoColumn = container.querySelectorAll('[data-rebar-part="column"]')[0]!;
      const collapseButton = within(todoColumn as HTMLElement).getByRole("button", { name: "Hide To do cards" });
      fireEvent.click(collapseButton);

      const card = screen.getByText("Ship it").closest('[data-rebar-part="card"]')!;
      const todoSection = todoColumn.querySelector('[data-rebar-part="section-cards"]')!;
      drag(card, todoSection);

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0]![0];
      expect(next.columns[0].sections[0].cardIds).toContain("c");
    });

    it("surfaces a matching card as a ghost while a search matches it, and hides it again once the search stops matching", () => {
      const { container, rerender } = render(<Kanban columns={COLUMNS} cards={CARDS} search="write" />);
      const todoColumn = container.querySelectorAll('[data-rebar-part="column"]')[0]!;
      const collapseButton = within(todoColumn as HTMLElement).getByRole("button", { name: "Hide To do cards" });
      fireEvent.click(collapseButton);

      // "write" matches card "a" ("Write spec") but not "b" ("Build UI") -- only the match ghosts.
      expect(within(todoColumn as HTMLElement).getByText("Write spec")).toBeInTheDocument();
      expect(within(todoColumn as HTMLElement).queryByText("Build UI")).not.toBeInTheDocument();
      const sectionCards = todoColumn.querySelector('[data-rebar-part="section-cards"]')!;
      expect(sectionCards).toHaveClass("rebar-kanban-section-cards-collapsed");

      // Narrowing the search to no longer match goes back to tray-only.
      rerender(<Kanban columns={COLUMNS} cards={CARDS} search="nonexistent term" />);
      expect(within(todoColumn as HTMLElement).queryByText("Write spec")).not.toBeInTheDocument();

      // Clearing the search entirely also goes back to tray-only.
      rerender(<Kanban columns={COLUMNS} cards={CARDS} search="write" />);
      expect(within(todoColumn as HTMLElement).getByText("Write spec")).toBeInTheDocument();
      rerender(<Kanban columns={COLUMNS} cards={CARDS} search="" />);
      expect(within(todoColumn as HTMLElement).queryByText("Write spec")).not.toBeInTheDocument();
    });
  });

  describe("sticky variant", () => {
    const STICKY_COLUMNS: KanbanColumn[] = [
      { id: "board", title: "Board", sections: [{ id: "board-main", cardIds: ["a", "b"] }] },
    ];

    it("gives a sticky's title dark text against a light default color, independent of ambient dark mode", () => {
      render(<Kanban columns={STICKY_COLUMNS} cards={CARDS} cardVariant="sticky" />);
      const title = screen.getByText("Write spec");
      expect(title).toHaveStyle({ color: "#212121" });
    });

    it("gives a sticky's title light text when its own color is explicitly set dark", () => {
      const cards = { ...CARDS, a: { ...CARDS.a!, color: "#212121" } };
      render(<Kanban columns={STICKY_COLUMNS} cards={cards} cardVariant="sticky" />);
      const title = screen.getByText("Write spec");
      expect(title).toHaveStyle({ color: "#f5f5f5" });
    });

    it("caps a column at 3 stickies even when no limit is set", () => {
      render(<Kanban columns={STICKY_COLUMNS} cards={CARDS} cardVariant="sticky" />);
      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    it("clamps an explicit column limit above 3 down to 3", () => {
      const columns: KanbanColumn[] = [{ ...STICKY_COLUMNS[0]!, limit: 10 }];
      render(<Kanban columns={columns} cards={CARDS} cardVariant="sticky" />);
      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    it("opens an edit form on click, and saves title/description/tag changes via onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Kanban columns={STICKY_COLUMNS} cards={CARDS} cardVariant="sticky" onChange={onChange} />);
      await user.click(screen.getByText("Write spec"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      const titleInput = screen.getByLabelText("Title");
      await user.clear(titleInput);
      await user.type(titleInput, "Write the spec");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onChange).toHaveBeenCalledTimes(1);
      const next = onChange.mock.calls[0]![0];
      expect(next.cards.a.title).toBe("Write the spec");
    });

    it("does not open the edit form after a drag", () => {
      const onChange = vi.fn();
      render(
        <Kanban columns={STICKY_COLUMNS} cards={CARDS} cardVariant="sticky" onChange={onChange} />,
      );
      const card = screen.getByText("Write spec").closest('[data-rebar-part="card"]')!;
      fireEvent.dragStart(card);
      fireEvent.dragEnd(card);
      fireEvent.click(card);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not render click-to-edit behavior for the default (non-sticky) variant", () => {
      render(<Kanban columns={STICKY_COLUMNS} cards={CARDS} />);
      fireEvent.click(screen.getByText("Write spec"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
