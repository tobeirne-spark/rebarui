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
