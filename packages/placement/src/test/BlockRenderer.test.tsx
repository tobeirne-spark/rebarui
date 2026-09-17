import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlockRenderer } from "../BlockRenderer";
import type { Construct } from "../schema";

describe("BlockRenderer", () => {
  it("renders a header block with title and close action", () => {
    const blocks: Construct[] = [{ type: "header", title: "Preview", action: { icon: "close" } }];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("renders a nav-bar block as real links, in order", () => {
    const blocks: Construct[] = [
      {
        type: "nav-bar",
        ariaLabel: "Main",
        items: [
          { label: "Docs", href: "/docs" },
          { label: "About", href: "/about" },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  });

  it("wraps a nav-bar block in a real, hand-resizable demo box when resizable is set, distinct from the real NavBar nested inside it", () => {
    const blocks: Construct[] = [
      { type: "nav-bar", ariaLabel: "Main", resizable: true, items: [{ label: "Docs", href: "/docs" }] },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    const root = container.querySelector('[data-rebar-placement-block="nav-bar"]') as HTMLElement;
    expect(root).toHaveAttribute("data-rebar-block-path", "blocks[0]");
    expect(root.style.resize).toBe("horizontal");
    const navBarRoot = root.querySelector('[data-rebar-component="navbar"]');
    expect(navBarRoot).not.toBeNull();
    expect(navBarRoot).not.toBe(root);
  });

  it("tags the real NavBar itself as the block root, with no resizable wrapper, when resizable is unset", () => {
    const blocks: Construct[] = [{ type: "nav-bar", ariaLabel: "Main", items: [{ label: "Docs", href: "/docs" }] }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    const root = container.querySelector('[data-rebar-placement-block="nav-bar"]') as HTMLElement;
    expect(root).toHaveAttribute("data-rebar-component", "navbar");
    expect(root.style.resize).toBe("");
  });

  it("renders a nav-index block with search chrome hidden under the threshold", () => {
    const blocks: Construct[] = [
      {
        type: "nav-index",
        ariaLabel: "Docs",
        items: [
          { label: "Introduction", href: "/docs" },
          { label: "Getting Started", href: "/docs/getting-started" },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("navigation", { name: "Docs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("href", "/docs");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("derives a page-index block's sections from sibling doc-section headings, and assigns matching anchor ids", () => {
    const blocks: Construct[] = [
      { type: "page-index" },
      { type: "doc-section", heading: "Getting Started", body: [{ kind: "text", text: "Intro" }] },
      { type: "doc-section", heading: "Advanced Usage!", body: [{ kind: "text", text: "More" }] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "Getting Started" })).toHaveAttribute(
      "href",
      "#getting-started",
    );
    expect(screen.getByRole("heading", { name: "Getting Started" })).toHaveAttribute(
      "id",
      "getting-started",
    );
    expect(screen.getByRole("link", { name: "Advanced Usage!" })).toHaveAttribute(
      "href",
      "#advanced-usage",
    );
  });

  it("uses a page-index block's own explicit sections instead of deriving them, for a page with no doc-section content", () => {
    const blocks: Construct[] = [
      {
        type: "page-index",
        sections: [
          { id: "intro", label: "Introduction" },
          { id: "usage", label: "Usage" },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("href", "#intro");
    expect(screen.getByRole("link", { name: "Usage" })).toHaveAttribute("href", "#usage");
  });

  it("prefers a page-index block's explicit sections over sibling doc-section headings when both are present", () => {
    const blocks: Construct[] = [
      { type: "page-index", sections: [{ id: "custom", label: "Custom Section" }] },
      { type: "doc-section", heading: "Ignored Heading", body: [{ kind: "text", text: "x" }] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "Custom Section" })).toHaveAttribute("href", "#custom");
    expect(screen.queryByRole("link", { name: "Ignored Heading" })).not.toBeInTheDocument();
  });

  it("renders a lone page-index block without the normal wrapping Box/Stack, so its real position:sticky element gets a containing block from whatever the caller places it in, not a collapsed single-child wrapper", () => {
    const blocks: Construct[] = [{ type: "page-index", sections: [{ id: "a", label: "A" }] }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("[data-rebar-placement-root]")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("data-rebar-placement-block", "page-index");
    expect(container.firstElementChild).toHaveAttribute("data-rebar-block-path", "blocks[0]");
  });

  it("still wraps normally when page-index shares the document with other blocks", () => {
    const blocks: Construct[] = [
      { type: "page-index", sections: [{ id: "a", label: "A" }] },
      { type: "doc-section", heading: "A", body: [{ kind: "text", text: "x" }] },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("[data-rebar-placement-root]")).not.toBeNull();
  });

  it("renders a lone site-header block without the normal wrapping Box/Stack, so it's a clean top-level <header> landmark", () => {
    const blocks: Construct[] = [{ type: "site-header", logo: { label: "Acme" }, items: [] }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("[data-rebar-placement-root]")).toBeNull();
    expect(container.firstElementChild?.tagName).toBe("HEADER");
  });

  it("renders a card-grid block with optional body, tags, and link per item", () => {
    const blocks: Construct[] = [
      {
        type: "card-grid",
        items: [
          { title: "Avatar", body: "Illustrated placeholder art.", href: "/components/avatar", linkLabel: "View reference →" },
          { title: "Accordion", tags: [{ label: "No reference page", tone: "warning" }] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Avatar")).toBeInTheDocument();
    expect(screen.getByText("Illustrated placeholder art.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View reference →" })).toHaveAttribute(
      "href",
      "/components/avatar",
    );
    expect(screen.getByText("Accordion")).toBeInTheDocument();
    expect(screen.getByText("No reference page")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View →" })).not.toBeInTheDocument();
  });

  it("renders a persona-card block", () => {
    const blocks: Construct[] = [
      { type: "persona-card", items: [{ name: "Priya Shah", meta: "Engineering lead" }] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
    expect(screen.getByText("Engineering lead")).toBeInTheDocument();
  });

  it("renders a data-list block's extended item shape (avatar, meta, action)", () => {
    const blocks: Construct[] = [
      {
        type: "data-list",
        items: [
          {
            title: "Priya Shah",
            meta: "Engineering",
            badge: "Active",
            avatarPlaceholder: true,
            action: { label: "View", href: "/team/priya" },
          },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/team/priya");
  });

  it("renders a wizard block via the real Wizard component, gating Next on a required field", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "wizard",
        steps: [
          { label: "Team", fields: [{ kind: "text", label: "Team name", required: true }] },
          { label: "Details", fields: [{ kind: "text", label: "Notes" }] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();
    await user.type(screen.getByLabelText("Team name *"), "Rebar");
    expect(next).toBeEnabled();
  });

  it("calls a wizard block's resolved onSubmit handler with the collected step values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const blocks: Construct[] = [
      {
        type: "wizard",
        steps: [{ label: "Team", fields: [{ kind: "text", label: "Team name" }] }],
        submitLabel: "Finish",
        onSubmit: "handleWizardSubmit",
      },
    ];
    render(<BlockRenderer blocks={blocks} handlers={{ handleWizardSubmit: onSubmit }} />);
    await user.type(screen.getByLabelText("Team name"), "Rebar");
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(onSubmit).toHaveBeenCalledWith({ "0-0": "Rebar" });
  });

  it("renders a card-kanban block with its title, columns, and cards", () => {
    const blocks: Construct[] = [
      {
        type: "card-kanban",
        title: "Sprint board",
        columns: [
          { id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: ["a"] }] },
          { id: "done", title: "Done", sections: [{ id: "done-main", cardIds: [] }] },
        ],
        cards: { a: { id: "a", title: "Write spec" } },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Sprint board")).toBeInTheDocument();
    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("Write spec")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="card-kanban"]')).toBeInTheDocument();
  });

  it("shows a card-kanban block's shared-with avatars and copies a share link on click", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "card-kanban",
        title: "Sprint board",
        sharedWith: [{ name: "Priya Shah" }],
        shareUrl: "https://example.com/board/1",
        columns: [{ id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: [] }] }],
        cards: {},
      },
    ];
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByLabelText("Shared with Priya Shah")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com/board/1");
  });

  it("filters a card-kanban block's visible cards via its search box", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "card-kanban",
        title: "Sprint board",
        columns: [{ id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: ["a", "b"] }] }],
        cards: { a: { id: "a", title: "Write spec" }, b: { id: "b", title: "Ship it" } },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.type(screen.getByLabelText("Search cards"), "write");
    expect(screen.getByText("Write spec")).toBeInTheDocument();
    expect(screen.queryByText("Ship it")).not.toBeInTheDocument();
  });

  it("shows a card-kanban block's board-settings button only when settingsBlocks is set", () => {
    const base = {
      type: "card-kanban" as const,
      title: "Sprint board",
      columns: [{ id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: [] }] }],
      cards: {},
    };
    const withSettings = render(
      <BlockRenderer
        blocks={[
          { ...base, settingsBlocks: [{ type: "banner", tone: "info", icon: "info", text: "Board settings go here" }] },
        ]}
      />,
    );
    expect(withSettings.queryByRole("button", { name: "Board settings" })).toBeInTheDocument();
    withSettings.unmount();

    const withoutSettings = render(<BlockRenderer blocks={[base]} />);
    expect(withoutSettings.queryByRole("button", { name: "Board settings" })).not.toBeInTheDocument();
  });

  it("renders a sticky-kanban block with the same chrome as card-kanban but capped-at-3, click-to-edit stickies", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "sticky-kanban",
        title: "Retro board",
        columns: [{ id: "board", title: "Board", sections: [{ id: "board-main", cardIds: ["a"] }] }],
        cards: { a: { id: "a", title: "Went well" } },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Retro board")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="sticky-kanban"]')).toBeInTheDocument();
    expect(screen.getByText("Went well")).toBeInTheDocument();

    await user.click(screen.getByText("Went well"));
    expect(screen.getByRole("dialog", { name: "Edit sticky" })).toBeInTheDocument();
  });

  it("a card-kanban block's live source board takes priority over its literal columns/cards", () => {
    const blocks: Construct[] = [
      {
        type: "card-kanban",
        title: "Sprint board",
        source: "board",
        columns: [{ id: "ignored", title: "Ignored", sections: [{ id: "ignored-main", cardIds: ["b"] }] }],
        cards: { b: { id: "b", title: "Literal card" } },
      },
    ];
    const board = {
      columns: [{ id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: ["a"] }] }],
      cards: { a: { id: "a", title: "Live card" } },
    };
    render(<BlockRenderer blocks={blocks} data={{ board }} />);
    expect(screen.getByText("Live card")).toBeInTheDocument();
    expect(screen.queryByText("Literal card")).not.toBeInTheDocument();
  });

  it("forwards a card-kanban block's resolved onChange handler straight through to the real Kanban component, when source is set", () => {
    const onChange = vi.fn();
    const board = {
      columns: [{ id: "todo", title: "To do", sections: [{ id: "todo-main", cardIds: [] }] }],
      cards: {},
    };
    const blocks: Construct[] = [
      { type: "card-kanban", title: "Sprint board", source: "board", onChange: "handleBoardChange" },
    ];
    render(<BlockRenderer blocks={blocks} data={{ board }} handlers={{ handleBoardChange: onChange }} />);
    // Kanban itself decides when to call onChange (drag/reorder) — this asserts the wiring reaches
    // it, not a simulated drag.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a banner block with an action label", () => {
    const blocks: Construct[] = [
      { type: "banner", tone: "info", icon: "info", text: "Nothing saved", action: { label: "Reset" } },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Nothing saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("renders a checklist block with one card per item, in order", () => {
    const blocks: Construct[] = [
      { type: "checklist", heading: "Checklist", items: ["First item", "Second item"] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
  });

  it("renders a goal-tracker block's aspiration/focus-area/goal hierarchy", () => {
    const blocks: Construct[] = [
      {
        type: "goal-tracker",
        aspiration: "Become the top board network",
        focusAreas: [
          {
            id: "fa1",
            text: "Grow membership",
            goals: [
              { id: "g1", text: "Reach 500 members", completed: false },
              { id: "g2", text: "Host 3 events", completed: true },
            ],
          },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Become the top board network")).toBeInTheDocument();
    expect(screen.getByText("Grow membership")).toBeInTheDocument();
    expect(screen.getByText("Reach 500 members")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 complete")).toBeInTheDocument();
    const toggles = screen.getAllByRole("checkbox");
    expect(toggles).toHaveLength(2);
    expect(toggles[1]).toHaveAttribute("aria-checked", "true");
  });

  it("renders the shared Empty component for a goal-tracker block with no focus areas", () => {
    const blocks: Construct[] = [{ type: "goal-tracker", aspiration: "Aspiration", focusAreas: [] }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("No focus areas yet")).toBeInTheDocument();
    expect(container.querySelector("[data-rebar-component='empty']")).toBeInTheDocument();
  });

  it("toggling a goal-tracker goal flips its completed state locally", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "goal-tracker",
        aspiration: "Aspiration",
        focusAreas: [{ id: "fa1", text: "Focus", goals: [{ id: "g1", text: "Goal", completed: false }] }],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const toggle = screen.getByRole("checkbox");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("adding a focus area/goal on a goal-tracker block inserts an empty, editable entry", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [{ type: "goal-tracker", aspiration: "Aspiration", focusAreas: [] }];
    render(<BlockRenderer blocks={blocks} />);

    await user.click(screen.getByRole("button", { name: "+ Add focus area" }));
    expect(screen.getByRole("button", { name: "Focus area, click to edit" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Add goal" }));
    expect(screen.getByRole("button", { name: "Goal, click to edit" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("deleting a goal-tracker goal requires Popconfirm confirmation", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "goal-tracker",
        aspiration: "Aspiration",
        focusAreas: [{ id: "fa1", text: "Focus", goals: [{ id: "g1", text: "Goal", completed: false }] }],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);

    await user.click(screen.getByRole("button", { name: 'Delete goal "Goal"' }));
    expect(screen.getByText('Delete "Goal"?')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(screen.queryByText("Goal")).not.toBeInTheDocument();
  });

  it("tags a goal-tracker block and its focus-area/goal items with block paths", () => {
    const blocks: Construct[] = [
      {
        type: "goal-tracker",
        aspiration: "Aspiration",
        focusAreas: [{ id: "fa1", text: "Focus", goals: [{ id: "g1", text: "Goal", completed: false }] }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector('[data-rebar-placement-block="goal-tracker"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
    expect(container.querySelector('[data-rebar-block-path="blocks[0].focusAreas[0]"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-rebar-block-path="blocks[0].focusAreas[0].goals[0]"]'),
    ).toBeInTheDocument();
  });

  it("renders a goal-tracker block's live source state instead of its literal aspiration/focusAreas", () => {
    const blocks: Construct[] = [{ type: "goal-tracker", source: "goalState" }];
    const goalState = { aspiration: "Live aspiration", focusAreas: [] as never[] };
    render(<BlockRenderer blocks={blocks} data={{ goalState }} />);
    expect(screen.getByText("Live aspiration")).toBeInTheDocument();
  });

  it("a goal-tracker block calls its resolved onChange handler with the full next state, instead of mutating local state, when source is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const goalState = {
      aspiration: "Aspiration",
      focusAreas: [{ id: "fa1", text: "Focus", goals: [{ id: "g1", text: "Goal", completed: false }] }],
    };
    const blocks: Construct[] = [{ type: "goal-tracker", source: "goalState", onChange: "handleGoalChange" }];
    render(<BlockRenderer blocks={blocks} data={{ goalState }} handlers={{ handleGoalChange: onChange }} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith({
      aspiration: "Aspiration",
      focusAreas: [{ id: "fa1", text: "Focus", goals: [{ id: "g1", text: "Goal", completed: true }] }],
    });
    // The checkbox itself doesn't flip — nothing re-renders `data` unless the live caller does.
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("renders an ai-chat block's transcript and title", () => {
    const blocks: Construct[] = [
      {
        type: "ai-chat",
        title: "Support chat",
        messages: [
          { id: "1", role: "assistant", content: "How can I help?" },
          { id: "2", role: "user", content: "My order hasn't arrived." },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Support chat")).toBeInTheDocument();
    expect(screen.getByText("How can I help?")).toBeInTheDocument();
    expect(screen.getByText("My order hasn't arrived.")).toBeInTheDocument();
  });

  it("an ai-chat block appends a sent message to the transcript locally, without fabricating a reply", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      { type: "ai-chat", messages: [{ id: "1", role: "assistant", content: "Ask me anything." }] },
    ];
    render(<BlockRenderer blocks={blocks} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "What's my order status?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText("What's my order status?")).toBeInTheDocument();
    // Still exactly the original assistant message plus the one new user message — nothing else
    // was fabricated in response.
    expect(screen.getAllByText(/Ask me anything\.|What's my order status\?/)).toHaveLength(2);
  });

  it("an ai-chat block's per-message avatar renders via the real Avatar component", () => {
    const { container } = render(
      <BlockRenderer
        blocks={[
          {
            type: "ai-chat",
            messages: [{ id: "1", role: "assistant", content: "Hi", avatarFallback: "Assistant" }],
          },
        ]}
      />,
    );
    expect(container.querySelector('[data-rebar-component="avatar"]')).toBeInTheDocument();
  });

  it("tags an ai-chat block with its block path", () => {
    const { container } = render(
      <BlockRenderer blocks={[{ type: "ai-chat", messages: [{ id: "1", role: "user", content: "Hi" }] }]} />,
    );
    expect(container.querySelector('[data-rebar-placement-block="ai-chat"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("renders an ai-chat block's live source messages instead of its literal messages array", () => {
    const blocks: Construct[] = [
      { type: "ai-chat", messages: [{ id: "literal", role: "assistant", content: "Ignored" }], source: "chatMessages" },
    ];
    const chatMessages = [{ id: "live", role: "assistant" as const, content: "Live reply" }];
    render(<BlockRenderer blocks={blocks} data={{ chatMessages }} />);
    expect(screen.getByText("Live reply")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });

  it("an ai-chat block calls its resolved onSend handler instead of appending locally, when source is set", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const blocks: Construct[] = [
      { type: "ai-chat", source: "chatMessages", onSend: "sendChatMessage" },
    ];
    render(
      <BlockRenderer
        blocks={blocks}
        data={{ chatMessages: [{ id: "1", role: "assistant", content: "Ask me anything." }] }}
        handlers={{ sendChatMessage: onSend }}
      />,
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "What's my order status?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith("What's my order status?");
    // Live path never fabricates a local echo — only the resolved handler was called.
    expect(screen.queryByText("What's my order status?")).not.toBeInTheDocument();
  });

  it("an ai-chat block falls back to local-append behavior when source is unset, even with onSend set", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const blocks: Construct[] = [
      { type: "ai-chat", messages: [{ id: "1", role: "assistant", content: "Ask me anything." }] },
    ];
    render(<BlockRenderer blocks={blocks} handlers={{ sendChatMessage: onSend }} />);
    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("renders a callout block with title and subtitle", () => {
    const blocks: Construct[] = [
      { type: "callout", tone: "warning", icon: "clock", title: "In progress", subtitle: "Some items incomplete" },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Some items incomplete")).toBeInTheDocument();
  });

  it("renders a feature-grid block with one entry per item", () => {
    const blocks: Construct[] = [
      {
        type: "feature-grid",
        items: [
          { title: "Headless", body: "Radix underneath" },
          { title: "Replaceable", body: "CSS-variable theming" },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Headless")).toBeInTheDocument();
    expect(screen.getByText("Radix underneath")).toBeInTheDocument();
    expect(screen.getByText("Replaceable")).toBeInTheDocument();
  });

  it("renders a pillar-grid block, linking each card's CTA via renderLink", () => {
    const blocks: Construct[] = [
      {
        type: "pillar-grid",
        items: [{ title: "Components", body: "The reference", href: "/components", cta: "Browse" }],
      },
    ];
    render(
      <BlockRenderer
        blocks={blocks}
        renderLink={({ href, children }) => <a href={href} data-testid="pillar-link">{children}</a>}
      />,
    );
    const link = screen.getByTestId("pillar-link");
    expect(link).toHaveAttribute("href", "/components");
    expect(screen.getByRole("button", { name: "Browse" })).toBeInTheDocument();
  });

  it("keeps DOM order equal to document order regardless of block type mix", () => {
    const blocks: Construct[] = [
      { type: "header", title: "Preview" },
      { type: "banner", tone: "info", text: "First" },
      { type: "checklist", items: ["A", "B"] },
      { type: "callout", tone: "warning", title: "Last" },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const root = screen.getByText("Preview").closest("[data-rebar-placement-root]") as HTMLElement;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const value = node.textContent?.trim();
      if (value) texts.push(value);
    }
    expect(texts).toEqual(["Preview", "First", "A", "B", "Last"]);
  });

  it("falls back to a plain anchor when no renderLink is supplied", () => {
    const blocks: Construct[] = [
      {
        type: "pillar-grid",
        items: [{ title: "Docs", body: "Read them", href: "/docs", cta: "Go" }],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/docs");
  });

  it("renders a form block with each field kind and a submit button", () => {
    const blocks: Construct[] = [
      {
        type: "form",
        heading: "Account Settings",
        fields: [
          { kind: "text", label: "Display name", placeholder: "e.g. Jane Doe" },
          { kind: "email", label: "Email address" },
          { kind: "textarea", label: "Bio" },
          { kind: "select", label: "Role", options: ["Admin", "Member"] },
          { kind: "checkbox", label: "Email me updates", checked: true },
        ],
        submitLabel: "Save changes",
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { name: "Account Settings" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.getByText("Bio")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Email me updates" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("omits the submit button when a form has no submitLabel (e.g. nested inside a modal)", () => {
    const blocks: Construct[] = [
      { type: "form", fields: [{ kind: "text", label: "Project name" }] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Project name")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("a form's fields are real controlled inputs, tracked in local state as the user types", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "form",
        fields: [
          { kind: "text", label: "Display name" },
          { kind: "checkbox", label: "Subscribe" },
        ],
        submitLabel: "Save",
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const input = screen.getByLabelText("Display name") as HTMLInputElement;
    await user.type(input, "Ada");
    expect(input).toHaveValue("Ada");

    const checkbox = screen.getByRole("checkbox", { name: "Subscribe" });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("a form with onSubmit calls the resolved handler with every field's current value, keyed by label", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const blocks: Construct[] = [
      {
        type: "form",
        fields: [
          { kind: "text", label: "Name" },
          { kind: "checkbox", label: "Subscribe" },
        ],
        submitLabel: "Create",
        onSubmit: "createRecord",
      },
    ];
    render(<BlockRenderer blocks={blocks} handlers={{ createRecord: onSubmit }} />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.click(screen.getByRole("checkbox", { name: "Subscribe" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledWith({ Name: "Ada", Subscribe: true });
  });

  it("a form with no onSubmit set is a no-op on submit, same as before", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      { type: "form", fields: [{ kind: "text", label: "Name" }], submitLabel: "Create" },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    // No error/throw on click with no handler resolved — the assertion here is that this doesn't
    // crash; nothing observable happens.
    await user.click(screen.getByRole("button", { name: "Create" }));
  });

  it("renders a table block with columns, rows, and a per-row action", () => {
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team", "Lead"],
        rows: [
          { cells: ["Engineering", "Priya Shah"], actionLabel: "Select" },
          { cells: ["Design", "Marcus Webb"], actionLabel: "Select" },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Select" })).toHaveLength(2);
  });

  it("renders a table block via the real Table component, sortable by default", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team"],
        rows: [{ cells: ["Zebra"] }, { cells: ["Alpha"] }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector('[data-rebar-component="table"]')).toBeInTheDocument();
    const cellsInOrder = () => Array.from(container.querySelectorAll("tbody td")).map((el) => el.textContent);
    expect(cellsInOrder()).toEqual(["Zebra", "Alpha"]);

    await user.click(screen.getByRole("columnheader", { name: /Team/ }).querySelector("button")!);
    expect(cellsInOrder()).toEqual(["Alpha", "Zebra"]);
  });

  it("filters a table block's rows via its own search box", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team", "Lead"],
        searchPlaceholder: "Search teams...",
        rows: [
          { cells: ["Engineering", "Priya Shah"] },
          { cells: ["Design", "Marcus Webb"] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.type(screen.getByPlaceholderText("Search teams..."), "priya");
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });

  it("filters a table block's rows via a named exact-match filter, collapsing extras into a More filters popover", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team", "Status"],
        rows: [
          { cells: ["Engineering", "Active"] },
          { cells: ["Design", "Archived"] },
        ],
        filters: [
          { label: "Status", columnIndex: 1, options: ["Active", "Archived"] },
          { label: "Extra 1", columnIndex: 0, options: ["Engineering"] },
          { label: "Extra 2", columnIndex: 0, options: ["Design"] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    // First filter renders inline; with 3 filters and an inline limit of 2, the rest collapse
    // behind a "More filters" trigger.
    expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More filters" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More filters" }));
    expect(screen.getByRole("combobox", { name: "Extra 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(screen.getByRole("option", { name: "Active" }));
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });

  it("adds a row to a table block via its own add-row form, without persisting past the local view", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team", "Lead"],
        rows: [{ cells: ["Engineering", "Priya Shah"] }],
        addable: { label: "Add team" },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.click(screen.getByRole("button", { name: "Add team" }));
    await user.type(screen.getByRole("textbox", { name: "Team" }), "Design");
    await user.type(screen.getByRole("textbox", { name: "Lead" }), "Marcus Webb");
    await user.click(screen.getByRole("button", { name: "Add team" }));
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Marcus Webb")).toBeInTheDocument();
  });

  it("exports a table block's currently visible rows as a downloaded CSV", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blobParts: string[] = [];
    const BlobSpy = vi.spyOn(globalThis, "Blob").mockImplementation((parts?: BlobPart[]) => {
      blobParts.push(String(parts?.[0] ?? ""));
      return {} as Blob;
    });

    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team", "Lead"],
        rows: [{ cells: ["Engineering", "Priya Shah"] }],
        exportable: true,
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(blobParts[0]).toBe("Team,Lead\r\nEngineering,Priya Shah");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    clickSpy.mockRestore();
    BlobSpy.mockRestore();
  });

  it("copies a table block's currently visible rows to the clipboard as tab-separated values", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team", "Lead"],
        rows: [{ cells: ["Engineering", "Priya Shah"] }],
        copyable: true,
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Team\tLead\nEngineering\tPriya Shah");
    expect(await screen.findByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("renders a table block's live source rows instead of its literal rows", () => {
    const blocks: Construct[] = [
      { type: "table", columns: ["Team"], rows: [{ cells: ["Ignored"] }], source: "teamRows" },
    ];
    render(<BlockRenderer blocks={blocks} data={{ teamRows: [{ cells: ["Live team"] }] }} />);
    expect(screen.getByText("Live team")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });

  it("fires a table block's resolved onRowAction handler with the row's index and data on action-button click", async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team"],
        source: "teamRows",
        onRowAction: "handleRowAction",
      },
    ];
    const teamRows = [{ cells: ["Engineering"], actionLabel: "Select" }];
    render(
      <BlockRenderer blocks={blocks} data={{ teamRows }} handlers={{ handleRowAction: onRowAction }} />,
    );
    await user.click(screen.getByRole("button", { name: "Select" }));
    expect(onRowAction).toHaveBeenCalledWith(0, teamRows[0]);
  });

  it("calls a table block's resolved onAddRow handler instead of mutating local rows, when source is set", async () => {
    const user = userEvent.setup();
    const onAddRow = vi.fn();
    const blocks: Construct[] = [
      {
        type: "table",
        columns: ["Team"],
        source: "teamRows",
        onAddRow: "handleAddRow",
        addable: { label: "Add team" },
      },
    ];
    render(
      <BlockRenderer
        blocks={blocks}
        data={{ teamRows: [{ cells: ["Engineering"] }] }}
        handlers={{ handleAddRow: onAddRow }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Add team" }));
    await user.type(screen.getByRole("textbox", { name: "Team" }), "Design");
    await user.click(screen.getByRole("button", { name: "Add team" }));
    expect(onAddRow).toHaveBeenCalledWith(["Design"]);
    // Live path never mutates local state — the live `teamRows` passed in is unchanged, so no
    // second row appears from a local append.
    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });

  it("forwards a table block's loading prop straight through to the real Table component's skeleton rows", () => {
    const blocks: Construct[] = [{ type: "table", columns: ["Team"], rows: [{ cells: ["Engineering"] }], loading: true }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    // Loading renders Skeleton placeholder rows instead of the real data — the literal row's text
    // is absent while loading.
    expect(screen.queryByText("Engineering")).not.toBeInTheDocument();
    expect(container.querySelector('[data-rebar-component="skeleton"]')).toBeInTheDocument();
  });

  it("renders a data-list block with a badge per item", () => {
    const blocks: Construct[] = [
      {
        type: "data-list",
        items: [
          { title: "Marketing Site Redesign", badge: "Active" },
          { title: "Legacy API Migration", badge: "Archived" },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Marketing Site Redesign")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("renders a filter-bar block with search, a select, and an action button", () => {
    const blocks: Construct[] = [
      {
        type: "filter-bar",
        searchPlaceholder: "Search projects…",
        filterOptions: ["All", "Active", "Archived"],
        actionLabel: "New Project",
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByPlaceholderText("Search projects…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Project" })).toBeInTheDocument();
  });

  it("renders a tabs block, showing the first tab's blocks by default", () => {
    const blocks: Construct[] = [
      {
        type: "tabs",
        tabs: [
          { label: "Team", blocks: [{ type: "callout", tone: "info", title: "Team panel" }] },
          { label: "Details", blocks: [{ type: "callout", tone: "info", title: "Details panel" }] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByText("Team panel")).toBeInTheDocument();
  });

  it("renders a modal block as an open dialog with its own blocks and footer actions", () => {
    const blocks: Construct[] = [
      {
        type: "modal",
        title: "New Project",
        blocks: [{ type: "form", fields: [{ kind: "text", label: "Project name" }] }],
        confirmLabel: "Create",
        cancelLabel: "Cancel",
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { name: "New Project" })).toBeInTheDocument();
    expect(screen.getByText("Project name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("tags every top-level block with a schema-shaped data-rebar-block-path", () => {
    const blocks: Construct[] = [
      { type: "header", title: "Preview" },
      { type: "checklist", items: ["A", "B"] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(document.querySelector('[data-rebar-block-path="blocks[0]"]')).not.toBeNull();
    expect(document.querySelector('[data-rebar-block-path="blocks[1]"]')).not.toBeNull();
  });

  it("tags individual checklist items with an item-level path and label", () => {
    const blocks: Construct[] = [{ type: "checklist", items: ["First item", "Second item"] }];
    render(<BlockRenderer blocks={blocks} />);
    const first = document.querySelector('[data-rebar-block-path="blocks[0].items[0]"]');
    const second = document.querySelector('[data-rebar-block-path="blocks[0].items[1]"]');
    expect(first).toHaveAttribute("data-rebar-block-item-label", "First item");
    expect(second).toHaveAttribute("data-rebar-block-item-label", "Second item");
  });

  it("nests the path through tabs and modal, matching the real schema shape", () => {
    const blocks: Construct[] = [
      {
        type: "tabs",
        tabs: [
          {
            label: "Team",
            blocks: [
              {
                type: "modal",
                title: "Confirm",
                blocks: [{ type: "callout", tone: "info", title: "Are you sure?" }],
              },
            ],
          },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    // blocks[0] (tabs) -> tabs[0] (Team) -> blocks[0] (modal) -> blocks[0] (callout)
    expect(
      document.querySelector('[data-rebar-block-path="blocks[0].tabs[0].blocks[0].blocks[0]"]'),
    ).not.toBeNull();
  });

  it("tags a form field with its path and label", () => {
    const blocks: Construct[] = [
      { type: "form", fields: [{ kind: "text", label: "Project name" }] },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const field = document.querySelector('[data-rebar-block-path="blocks[0].fields[0]"]');
    expect(field).toHaveAttribute("data-rebar-block-item-label", "Project name");
  });

  it("renders a hero block with badge, title, subtitle, actions, and a code snippet", () => {
    const blocks: Construct[] = [
      {
        type: "hero",
        badge: "v0.1",
        title: "Rebar UI",
        subtitle: "Headless-first, low-fidelity components.",
        actions: [
          { label: "Getting Started", href: "/docs/getting-started", variant: "primary" },
          { label: "Design Heuristics", href: "/docs/theming" },
        ],
        codeSnippet: "npm install rebar-ui",
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { name: "Rebar UI", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("v0.1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Getting Started" })).toHaveAttribute(
      "href",
      "/docs/getting-started",
    );
    expect(screen.getByText("npm install rebar-ui")).toBeInTheDocument();
  });

  it("renders a section-header block with kicker, title, and subtitle", () => {
    const blocks: Construct[] = [
      { type: "section-header", kicker: "Theme customization", title: "Sketch today, anything tomorrow", subtitle: "No code changes, just a theme swap." },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Theme customization")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sketch today, anything tomorrow" })).toBeInTheDocument();
    expect(screen.getByText("No code changes, just a theme swap.")).toBeInTheDocument();
  });

  it("renders a doc-section block's heading at level 1, for a page's own title", () => {
    const blocks: Construct[] = [{ type: "doc-section", heading: "Page Title", level: 1, body: [{ kind: "text", text: "Intro." }] }];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { level: 1, name: "Page Title" })).toBeInTheDocument();
  });

  it("defaults a doc-section block's heading to level 2 when level is omitted", () => {
    const blocks: Construct[] = [{ type: "doc-section", heading: "Section", body: [{ kind: "text", text: "Text." }] }];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  });

  it("renders a doc-section block's prose, code, and list nodes in order", () => {
    const blocks: Construct[] = [
      {
        type: "doc-section",
        heading: "1. Install",
        body: [
          { kind: "code", code: "npm install rebar-ui" },
          { kind: "text", text: "Swap `@rebar-ui/theme-sketch` for a different theme any time." },
          { kind: "list", items: ["First step", "Second step"] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const root = screen.getByText("1. Install").closest("[data-rebar-placement-block='doc-section']") as HTMLElement;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const value = node.textContent?.trim();
      if (value) texts.push(value);
    }
    expect(texts).toEqual([
      "1. Install",
      "Copy",
      "npm install rebar-ui",
      "Swap",
      "@rebar-ui/theme-sketch",
      "for a different theme any time.",
      "First step",
      "Second step",
    ]);
  });

  it("parses inline backtick-code and markdown-style links in doc-section prose", () => {
    const blocks: Construct[] = [
      {
        type: "doc-section",
        body: [{ kind: "text", text: "See the [component reference](/components) for details." }],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "component reference" })).toHaveAttribute(
      "href",
      "/components",
    );
  });

  it("parses inline *emphasis* markup in doc-section prose, in both text and list items", () => {
    const blocks: Construct[] = [
      {
        type: "doc-section",
        body: [
          { kind: "text", text: "This is *emphasized* text." },
          { kind: "list", items: ["An *emphasized* list item."] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    const emphasized = screen.getAllByText("emphasized");
    expect(emphasized).toHaveLength(2);
    for (const el of emphasized) {
      expect(el.tagName).toBe("EM");
    }
    // The asterisks themselves must not leak through as literal characters.
    expect(screen.queryByText(/\*/)).not.toBeInTheDocument();
  });

  it("renders a props-table block with prop rows", () => {
    const blocks: Construct[] = [
      {
        type: "props-table",
        rows: [
          { name: "variant", type: '"primary" | "secondary"', required: false, defaultValue: '"secondary"', description: null },
          { name: "onClick", type: "() => void", required: true, defaultValue: null, description: null },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("variant")).toBeInTheDocument();
    expect(screen.getByText('"secondary"')).toBeInTheDocument();
    expect(screen.getAllByText("Yes")).toHaveLength(1);
    expect(screen.getAllByText("No")).toHaveLength(1);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a fallback message for a props-table block with no rows", () => {
    const blocks: Construct[] = [{ type: "props-table", rows: [] }];
    render(<BlockRenderer blocks={blocks} />);
    expect(
      screen.getByText("No component-specific props (only standard HTML/ARIA attributes, forwarded as-is)."),
    ).toBeInTheDocument();
  });

  it("tags a props-table block with its schema-shaped path", () => {
    const blocks: Construct[] = [{ type: "props-table", rows: [{ name: "x", type: "string", required: false, defaultValue: null, description: null }] }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector('[data-rebar-placement-block="props-table"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("renders an iframe block with its src, title, and a default height when none is set", () => {
    const blocks: Construct[] = [{ type: "iframe", src: "https://example.com", title: "Migrated build" }];
    render(<BlockRenderer blocks={blocks} />);
    const iframe = screen.getByTitle("Migrated build");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("src", "https://example.com");
    expect(iframe).toHaveStyle({ height: "300px" });
  });

  it("respects an iframe block's own explicit height", () => {
    const blocks: Construct[] = [{ type: "iframe", src: "https://example.com", title: "Migrated build", height: 480 }];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByTitle("Migrated build")).toHaveStyle({ height: "480px" });
  });

  it("renders a comparison block's two labeled panels with their own nested blocks, in DOM order", () => {
    const blocks: Construct[] = [
      {
        type: "comparison",
        leftLabel: "Rebar",
        leftBlocks: [{ type: "checklist", heading: "Checklist", items: ["One", "Two"] }],
        rightLabel: "Ant Design",
        rightBlocks: [{ type: "iframe", src: "https://example.com", title: "antd build" }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Rebar")).toBeInTheDocument();
    expect(screen.getByText("Ant Design")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByTitle("antd build")).toBeInTheDocument();

    const labels = Array.from(container.querySelectorAll('[data-rebar-placement-block="comparison"] > * > p')).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(["Rebar", "Ant Design"]);
  });

  it("tags a comparison block and its nested left/right blocks with schema-shaped paths", () => {
    const blocks: Construct[] = [
      {
        type: "comparison",
        leftLabel: "Rebar",
        leftBlocks: [{ type: "checklist", heading: "Checklist", items: ["One"] }],
        rightLabel: "Ant Design",
        rightBlocks: [{ type: "iframe", src: "https://example.com", title: "antd build" }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector('[data-rebar-placement-block="comparison"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
    expect(container.querySelector('[data-rebar-placement-block="checklist"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0].leftBlocks[0]",
    );
    expect(container.querySelector('[data-rebar-placement-block="iframe"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0].rightBlocks[0]",
    );
  });

  it("renders a side-panel block's main content and panel content, panel open by default", () => {
    const blocks: Construct[] = [
      {
        type: "side-panel",
        main: [{ type: "checklist", heading: "Checklist", items: ["One", "Two"] }],
        panel: { title: "Thread", blocks: [{ type: "callout", tone: "info", title: "Reply" }] },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Thread" })).toBeInTheDocument();
    expect(screen.getByText("Reply")).toBeInTheDocument();
  });

  it("a side-panel block's panel collapses to a rail and reopens, without touching main content", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "side-panel",
        main: [{ type: "checklist", heading: "Checklist", items: ["One"] }],
        panel: { title: "Thread", blocks: [{ type: "callout", tone: "info", title: "Reply" }] },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    await user.click(screen.getByRole("button", { name: "Collapse Thread" }));
    expect(screen.queryByText("Reply")).not.toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("respects panel.defaultOpen: false, starting collapsed", () => {
    const blocks: Construct[] = [
      {
        type: "side-panel",
        main: [{ type: "checklist", heading: "Checklist", items: ["One"] }],
        panel: { title: "Thread", blocks: [{ type: "callout", tone: "info", title: "Reply" }], defaultOpen: false },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.queryByText("Reply")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Thread" })).toBeInTheDocument();
  });

  it("tags a side-panel block and its nested main/panel blocks with schema-shaped paths", () => {
    const blocks: Construct[] = [
      {
        type: "side-panel",
        main: [{ type: "checklist", heading: "Checklist", items: ["One"] }],
        panel: { title: "Thread", blocks: [{ type: "callout", tone: "info", title: "Reply" }] },
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector('[data-rebar-placement-block="side-panel"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
    expect(container.querySelector('[data-rebar-placement-block="checklist"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0].main[0]",
    );
    expect(container.querySelector('[data-rebar-placement-block="callout"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0].panel.blocks[0]",
    );
  });

  it("renders a heuristic block's title, rule, rationale, code sample, and anchor id", () => {
    const blocks: Construct[] = [
      {
        type: "heuristic",
        id: "recognition",
        title: "1. Recognition over recall",
        rule: "Labels above inputs, visible options over hidden menus.",
        rationale: [{ kind: "text", text: "From `Nielsen`'s heuristics — see [the source](https://example.com)." }],
        code: '{ type: "form" }',
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { name: "1. Recognition over recall" })).toBeInTheDocument();
    expect(document.getElementById("recognition")).toContainElement(
      screen.getByRole("heading", { name: "1. Recognition over recall" }),
    );
    expect(screen.getByText("Labels above inputs, visible options over hidden menus.")).toBeInTheDocument();
    expect(screen.getByText("Nielsen", { selector: "code" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "the source" })).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText('{ type: "form" }')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="heuristic"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("renders a heuristic block's optional live exampleBlocks recursively, and omits the demo box when absent", () => {
    const withExample: Construct[] = [
      {
        type: "heuristic",
        id: "consistency",
        title: "2. Consistency",
        rule: "One token set.",
        rationale: [{ kind: "text", text: "Rationale text." }],
        exampleBlocks: [{ type: "checklist", heading: "Checklist", items: ["One"] }],
      },
    ];
    const { container: withExampleContainer } = render(<BlockRenderer blocks={withExample} />);
    expect(withExampleContainer.querySelector('[data-rebar-placement-block="checklist"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0].exampleBlocks[0]",
    );

    const withoutExample: Construct[] = [
      {
        type: "heuristic",
        id: "no-example",
        title: "No example",
        rule: "Rule.",
        rationale: [{ kind: "text", text: "Rationale text." }],
      },
    ];
    const { container: withoutExampleContainer } = render(<BlockRenderer blocks={withoutExample} />);
    expect(withoutExampleContainer.querySelector('[data-rebar-placement-block="checklist"]')).toBeNull();
  });

  it("renders a spin-card block's items inside a real Spin/Card, with its own tip and sizing", () => {
    const blocks: Construct[] = [
      { type: "spin-card", tip: "Fetching", items: ["Project A", "Project B", "Project C"], width: 220, minHeight: 120 },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
    expect(screen.getByText("Project C")).toBeInTheDocument();
    expect(screen.getByText("Fetching")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="spin-card"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
    expect(container.querySelector('[data-rebar-block-path="blocks[0].items[1]"]')).toHaveTextContent("Project B");
  });

  it("defaults a spin-card block's tip when omitted", () => {
    const blocks: Construct[] = [{ type: "spin-card", items: ["Row"] }];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders an error-block block with its status's default copy, full-page by default, and a real retry action", () => {
    const blocks: Construct[] = [{ type: "error-block", status: "disconnected", action: { label: "Retry" } }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("No connection")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(container.querySelector(".rebar-error-block-full-page")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="error-block"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("an error-block block's title/description override the status default, and fullPage: false opts out of the wide layout", () => {
    const blocks: Construct[] = [
      { type: "error-block", title: "Board failed to load", description: "Try refreshing the page.", fullPage: false },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Board failed to load")).toBeInTheDocument();
    expect(screen.getByText("Try refreshing the page.")).toBeInTheDocument();
    expect(container.querySelector(".rebar-error-block-full-page")).not.toBeInTheDocument();
  });

  it("renders a footer block's label, content, links, and chips", () => {
    const blocks: Construct[] = [
      {
        type: "footer",
        label: "No more results",
        content: "© 2026 Example Inc.",
        links: [{ text: "Terms", href: "/terms" }],
        chips: [{ text: "New" }, { text: "Feedback", type: "link" }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("No more results")).toBeInTheDocument();
    expect(screen.getByText("© 2026 Example Inc.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Feedback" })).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="footer"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("a footer block with no sections set renders nothing but the wrapper", () => {
    const blocks: Construct[] = [{ type: "footer" }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    const footer = container.querySelector('[data-rebar-placement-block="footer"]');
    expect(footer).toBeInTheDocument();
    expect(footer?.children.length).toBe(0);
  });

  it("renders a site-header block's logo, nav-bar, and no trailing content when trailing is omitted", () => {
    const blocks: Construct[] = [
      {
        type: "site-header",
        logo: { label: "Acme", href: "/" },
        items: [{ label: "Docs", href: "/docs" }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    const root = container.querySelector('[data-rebar-placement-block="site-header"]');
    expect(root?.tagName).toBe("HEADER");
    expect(root).toHaveAttribute("data-rebar-block-path", "blocks[0]");
  });

  it("logo.iconPath renders a real inline <svg fill=\"currentColor\"> instead of an <img>, and takes priority over iconSrc", () => {
    const blocks: Construct[] = [
      {
        type: "site-header",
        logo: { label: "Acme", iconSrc: "/ignored.svg", iconPath: "M0 0h24v24H0z", iconViewBox: "0 0 24 24" },
        items: [{ label: "Docs", href: "/docs" }],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    const svg = container.querySelector("header svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg?.querySelector("path")).toHaveAttribute("d", "M0 0h24v24H0z");
    expect(container.querySelector("header img")).not.toBeInTheDocument();
  });

  it("renders a site-header block's text trailing content", () => {
    const blocks: Construct[] = [
      {
        type: "site-header",
        logo: { label: "Acme" },
        items: [{ label: "Docs", href: "/docs" }],
        trailing: { kind: "text", text: "v1.0.0" },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });

  it("renders a site-header block's login trailing content as a real link when href is set", () => {
    const blocks: Construct[] = [
      {
        type: "site-header",
        logo: { label: "Acme" },
        items: [{ label: "Docs", href: "/docs" }],
        trailing: { kind: "login", label: "Sign in", href: "/login" },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("renders a site-header block's avatar trailing content", () => {
    const blocks: Construct[] = [
      {
        type: "site-header",
        logo: { label: "Acme" },
        items: [{ label: "Docs", href: "/docs" }],
        trailing: { kind: "avatar", name: "Jane Doe", href: "/account" },
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("link", { name: "Jane Doe" })).toHaveAttribute("href", "/account");
  });

  it("omits the theme toggle when themeToggle is unset", () => {
    const blocks: Construct[] = [{ type: "site-header", logo: { label: "Acme" }, items: [] }];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.queryByRole("button", { name: "Theme" })).not.toBeInTheDocument();
  });

  it("shows the real ThemeToggle component alongside its own trailing content when themeToggle is set", () => {
    const blocks: Construct[] = [
      {
        type: "site-header",
        logo: { label: "Acme" },
        items: [],
        trailing: { kind: "text", text: "v1.0" },
        themeToggle: true,
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("v1.0")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-component="theme-toggle"]')).toBeInTheDocument();
    // ThemeToggle's own toggling behavior (data-rebar-theme/data-theme/data-rebar-bionic) is
    // covered by its own component tests (packages/core) — this only confirms the block wires it.
  });

  it("renders a scatter-chart block with its series and title", () => {
    const blocks: Construct[] = [
      {
        type: "scatter-chart",
        title: "Token cost",
        series: [
          { label: "antd", values: [10, 11] },
          { label: "rebar-ui", values: [8, 9] },
        ],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("img", { name: "Token cost" })).toBeInTheDocument();
    expect(screen.getByText("Token cost")).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(4);
    expect(container.querySelector('[data-rebar-placement-block="scatter-chart"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("filters a scatter-chart block's series via its own filter footer, and omits the footer for a single series", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "scatter-chart",
        series: [
          { label: "antd", values: [10, 11] },
          { label: "rebar-ui", values: [8, 9] },
        ],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelectorAll("circle")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "rebar-ui" }));
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "rebar-ui" })).toHaveAttribute("aria-pressed", "false");

    const single = render(<BlockRenderer blocks={[{ type: "scatter-chart", series: [{ label: "antd", values: [1] }] }]} />);
    expect(within(single.container).queryByRole("button", { name: "antd" })).not.toBeInTheDocument();
  });

  it("renders a line-chart block with a crossover marker", () => {
    const blocks: Construct[] = [
      {
        type: "line-chart",
        title: "Cumulative cost",
        xLabels: ["R0", "R1"],
        crossoverIndex: 1,
        series: [
          { label: "antd", values: [10, 20] },
          { label: "rebar-ui + migration", values: [15, 18], dashed: true },
        ],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("img", { name: "Cumulative cost" })).toBeInTheDocument();
    expect(screen.getByText("crossover")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="line-chart"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("filters a line-chart block's series via its own filter footer", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "line-chart",
        xLabels: ["R0", "R1"],
        series: [
          { label: "antd", values: [10, 20] },
          { label: "rebar-ui", values: [15, 18] },
        ],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "antd" }));
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "antd" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "rebar-ui" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders a stacked-bar-chart block with its bars and total labels", () => {
    const blocks: Construct[] = [
      {
        type: "stacked-bar-chart",
        title: "Cost composition",
        bars: [
          {
            label: "Hire developers",
            segments: [{ label: "Build", value: 16800 }],
          },
        ],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("img", { name: "Cost composition" })).toBeInTheDocument();
    expect(screen.getByText("Hire developers")).toBeInTheDocument();
    expect(screen.getByText("$16,800")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="stacked-bar-chart"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("filters a stacked-bar-chart block's segment labels across every bar at once", async () => {
    const user = userEvent.setup();
    const blocks: Construct[] = [
      {
        type: "stacked-bar-chart",
        bars: [
          { label: "2024", segments: [{ label: "Build", value: 100 }, { label: "Support", value: 20 }] },
          { label: "2025", segments: [{ label: "Build", value: 80 }, { label: "Support", value: 30 }] },
        ],
      },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("$120")).toBeInTheDocument(); // 2024 total: 100+20
    expect(screen.getByText("$110")).toBeInTheDocument(); // 2025 total: 80+30

    await user.click(screen.getByRole("button", { name: "Support" }));
    expect(screen.getByText("$100")).toBeInTheDocument(); // 2024 total, Support removed
    expect(screen.getByText("$80")).toBeInTheDocument(); // 2025 total, Support removed
    expect(screen.queryByText("$120")).not.toBeInTheDocument();
  });

  it("renders a scatter-chart block's live source series instead of its literal series", () => {
    const blocks: Construct[] = [
      { type: "scatter-chart", title: "Chart", series: [{ label: "Ignored", values: [1] }], source: "points" },
    ];
    render(<BlockRenderer blocks={blocks} data={{ points: [{ label: "Live series", values: [1, 2] }] }} />);
    expect(screen.getByText("Live series")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });

  it("renders a line-chart block's live source series instead of its literal series", () => {
    const blocks: Construct[] = [
      {
        type: "line-chart",
        title: "Chart",
        xLabels: ["A", "B"],
        series: [{ label: "Ignored", values: [1, 2] }],
        source: "points",
      },
    ];
    render(<BlockRenderer blocks={blocks} data={{ points: [{ label: "Live series", values: [3, 4] }] }} />);
    expect(screen.getByText("Live series")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });

  it("renders a stacked-bar-chart block's live source bars instead of its literal bars", () => {
    const blocks: Construct[] = [
      {
        type: "stacked-bar-chart",
        bars: [{ label: "Ignored", segments: [{ label: "Ignored segment", value: 1 }] }],
        source: "bars",
      },
    ];
    render(
      <BlockRenderer
        blocks={blocks}
        data={{ bars: [{ label: "Live bar", segments: [{ label: "Live segment", value: 5 }] }] }}
      />,
    );
    expect(screen.getByText("Live bar")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });

  it("renders a stats-table block's headers and rows through the real Table component", () => {
    const blocks: Construct[] = [
      {
        type: "stats-table",
        headers: ["Condition", "Mean", "Std. dev."],
        rows: [
          ["antd", "31,231", "294"],
          ["rebar-ui", "30,211", "28.6"],
        ],
      },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByRole("columnheader", { name: "Mean" })).toBeInTheDocument();
    expect(screen.getByText("31,231")).toBeInTheDocument();
    expect(screen.getByText("rebar-ui")).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-placement-block="stats-table"]')).toHaveAttribute(
      "data-rebar-block-path",
      "blocks[0]",
    );
  });

  it("renders a gallery block as a labeled Carousel of numbered screenshots", () => {
    const blocks: Construct[] = [
      { type: "gallery", label: "antd", dir: "/shots", prefix: "antd-text", count: 3 },
    ];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("antd")).toBeInTheDocument();
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute("src", "/shots/antd-text-01.png");
    expect(images[0]).toHaveAttribute("alt", "antd, run 01");
    expect(container.querySelector('[data-rebar-placement-block="gallery"]')).toBeInTheDocument();
  });

  it("defaults a gallery block's count to 15", () => {
    const blocks: Construct[] = [{ type: "gallery", label: "rebar-ui", dir: "/shots", prefix: "rebar-text" }];
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelectorAll("img")).toHaveLength(15);
  });
});
