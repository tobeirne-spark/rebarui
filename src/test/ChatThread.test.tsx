import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatThread } from "../components/ChatThread";
import type { ChatMessage } from "../components/ChatThread";

afterEach(cleanup);

/** jsdom has no real layout — scrollHeight/clientHeight/scrollTop default to 0 on every element —
 * so scroll geometry is faked the same way SectionNav's own scroll tests do: an own-instance
 * accessor property (not a prototype-wide override, since only one container in each of these
 * tests needs custom geometry), backed by a plain mutable closure variable. `scrollTop` is
 * writable (not just readable) because `ChatThread`'s auto-scroll assigns `el.scrollTop =
 * el.scrollHeight` directly, and the `Element.prototype.scrollTo` polyfill in test/setup.ts also
 * assigns through `this.scrollTop`, which resolves to this same accessor. */
function mockContainerGeometry(
  el: HTMLElement,
  initial: { scrollTop?: number; clientHeight: number; scrollHeight: number },
) {
  let scrollTop = initial.scrollTop ?? 0;
  let clientHeight = initial.clientHeight;
  let scrollHeight = initial.scrollHeight;

  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (v: number) => {
      scrollTop = v;
    },
  });
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });

  return {
    getScrollTop: () => scrollTop,
    setScrollTop: (v: number) => {
      scrollTop = v;
    },
    setScrollHeight: (v: number) => {
      scrollHeight = v;
    },
  };
}

function getScrollContainer(): HTMLElement {
  return document.querySelector('[data-rebar-part="scroll"]') as HTMLElement;
}

const BASE_MESSAGES: ChatMessage[] = [
  { id: "1", role: "user", content: "Hello there" },
  { id: "2", role: "assistant", content: "Hi, how can I help?" },
];

describe("ChatThread", () => {
  it("carries data-rebar-component on the root", () => {
    const { container } = render(<ChatThread messages={BASE_MESSAGES} />);
    expect(container.querySelector('[data-rebar-component="chat-thread"]')).toBeInTheDocument();
  });

  it("renders every message with role-based markers", () => {
    render(<ChatThread messages={BASE_MESSAGES} />);
    const messageEls = document.querySelectorAll('[data-rebar-part="message"]');
    expect(messageEls).toHaveLength(2);
    expect(messageEls[0]).toHaveAttribute("data-rebar-role", "user");
    expect(messageEls[0]).toHaveClass("rebar-chat-message-user");
    expect(messageEls[1]).toHaveAttribute("data-rebar-role", "assistant");
    expect(messageEls[1]).toHaveClass("rebar-chat-message-assistant");
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Hi, how can I help?")).toBeInTheDocument();
  });

  it("defaults status to 'sent' when omitted", () => {
    render(<ChatThread messages={BASE_MESSAGES} />);
    const messageEls = document.querySelectorAll('[data-rebar-part="message"]');
    expect(messageEls[0]).toHaveAttribute("data-rebar-status", "sent");
  });

  describe("empty state", () => {
    it("shows the shared Empty component instead of a blank scroll area", () => {
      const { container } = render(<ChatThread messages={[]} />);
      expect(screen.getByText("Start the conversation")).toBeInTheDocument();
      expect(container.querySelector('[data-rebar-component="empty"]')).toBeInTheDocument();
      expect(container.querySelector('[data-rebar-part="scroll"]')).not.toBeInTheDocument();
    });

    it("shows a custom emptyMessage when provided", () => {
      render(<ChatThread messages={[]} emptyMessage="No messages yet" />);
      expect(screen.getByText("No messages yet")).toBeInTheDocument();
      expect(screen.queryByText("Start the conversation")).not.toBeInTheDocument();
    });
  });

  describe("typing indicator", () => {
    it("is absent by default", () => {
      render(<ChatThread messages={BASE_MESSAGES} />);
      expect(document.querySelector('[data-rebar-part="typing-indicator"]')).not.toBeInTheDocument();
    });

    it("shows a labeled indicator when isTyping is true", () => {
      render(<ChatThread messages={BASE_MESSAGES} isTyping />);
      expect(screen.getByRole("status", { name: "Assistant is typing" })).toBeInTheDocument();
      expect(document.querySelector('[data-rebar-part="typing-indicator"]')).toBeInTheDocument();
    });

    it("hides again once isTyping goes back to false", () => {
      const { rerender } = render(<ChatThread messages={BASE_MESSAGES} isTyping />);
      expect(document.querySelector('[data-rebar-part="typing-indicator"]')).toBeInTheDocument();
      rerender(<ChatThread messages={BASE_MESSAGES} isTyping={false} />);
      expect(document.querySelector('[data-rebar-part="typing-indicator"]')).not.toBeInTheDocument();
    });
  });

  describe("retry affordance", () => {
    it("shows a retry button only on a message with status 'error'", () => {
      const messages: ChatMessage[] = [
        { id: "1", role: "user", content: "Hi", status: "sent" },
        { id: "2", role: "assistant", content: "...", status: "streaming" },
        { id: "3", role: "user", content: "Retry me", status: "error" },
      ];
      render(<ChatThread messages={messages} />);
      const retryButtons = screen.getAllByRole("button", { name: "Retry" });
      expect(retryButtons).toHaveLength(1);
      expect(retryButtons[0]).toHaveAttribute("data-rebar-part", "retry-button");
    });

    it("fires onRetry with the errored message when clicked, and only that message", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      const errored: ChatMessage = { id: "3", role: "user", content: "Retry me", status: "error" };
      render(
        <ChatThread
          messages={[{ id: "1", role: "user", content: "Hi", status: "sent" }, errored]}
          onRetry={onRetry}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(errored);
    });

    it("has a real >=44x44 touch target", () => {
      render(
        <ChatThread messages={[{ id: "1", role: "user", content: "Retry me", status: "error" }]} />,
      );
      const button = screen.getByRole("button", { name: "Retry" });
      // jsdom has no real layout to measure, so this asserts the CSS contract instead: the shared
      // `Button` component's default "md" size, which style.css gives min-height: 44px (only
      // "sm" drops to 32px) — ChatThread never overrides this to "sm".
      expect(button).toHaveAttribute("data-rebar-size", "md");
    });
  });

  describe("bionic reading", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("data-rebar-bionic");
    });

    it("renders message content plainly by default", () => {
      const { container } = render(<ChatThread messages={BASE_MESSAGES} />);
      expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
    });

    it("follows the ambient data-rebar-bionic attribute", () => {
      document.documentElement.setAttribute("data-rebar-bionic", "true");
      const { container } = render(<ChatThread messages={BASE_MESSAGES} />);
      expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
    });
  });

  describe("scroll-to-bottom / auto-scroll logic", () => {
    it("is hidden on initial render", () => {
      render(<ChatThread messages={BASE_MESSAGES} />);
      expect(
        screen.queryByRole("button", { name: "New messages below" }),
      ).not.toBeInTheDocument();
    });

    it("auto-scrolls to the new bottom when the user is already at/near the bottom", () => {
      const { rerender } = render(<ChatThread messages={BASE_MESSAGES} />);
      const scroller = getScrollContainer();
      const geometry = mockContainerGeometry(scroller, { scrollTop: 300, clientHeight: 300, scrollHeight: 300 });
      // At the bottom: scrollHeight(300) - scrollTop(300) - clientHeight(300) is well within
      // threshold — mark it so via a real scroll event, same as a person would generate one.
      fireEvent.scroll(scroller);

      // New content arrives; the container "grows" the way a real one would once the new bubble
      // is in the DOM.
      geometry.setScrollHeight(500);
      const next = [...BASE_MESSAGES, { id: "3", role: "assistant" as const, content: "More content" }];
      rerender(<ChatThread messages={next} />);

      expect(geometry.getScrollTop()).toBe(500);
      expect(
        screen.queryByRole("button", { name: "New messages below" }),
      ).not.toBeInTheDocument();
    });

    it("does not yank the user back down, and shows the floating button, once they've scrolled away", () => {
      const { rerender } = render(<ChatThread messages={BASE_MESSAGES} />);
      const scroller = getScrollContainer();
      const geometry = mockContainerGeometry(scroller, { scrollTop: 0, clientHeight: 200, scrollHeight: 500 });
      // Scrolled up to read history: scrollHeight(500) - scrollTop(0) - clientHeight(200) = 300,
      // well past the "at bottom" threshold.
      fireEvent.scroll(scroller);

      geometry.setScrollHeight(700);
      const next = [...BASE_MESSAGES, { id: "3", role: "assistant" as const, content: "More content" }];
      rerender(<ChatThread messages={next} />);

      // Not yanked back down.
      expect(geometry.getScrollTop()).toBe(0);
      // The affordance appears because real new content arrived while scrolled away.
      expect(screen.getByRole("button", { name: "New messages below" })).toBeInTheDocument();
    });

    it("does not show the button merely from re-rendering with no new content while scrolled away", () => {
      const { rerender } = render(<ChatThread messages={BASE_MESSAGES} />);
      const scroller = getScrollContainer();
      mockContainerGeometry(scroller, { scrollTop: 0, clientHeight: 200, scrollHeight: 500 });
      fireEvent.scroll(scroller);

      // Same messages, new array reference — no real content change.
      rerender(<ChatThread messages={[...BASE_MESSAGES]} />);

      expect(
        screen.queryByRole("button", { name: "New messages below" }),
      ).not.toBeInTheDocument();
    });

    it("clicking the button scrolls to bottom and hides itself again", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ChatThread messages={BASE_MESSAGES} />);
      const scroller = getScrollContainer();
      const geometry = mockContainerGeometry(scroller, { scrollTop: 0, clientHeight: 200, scrollHeight: 500 });
      fireEvent.scroll(scroller);

      geometry.setScrollHeight(700);
      const next = [...BASE_MESSAGES, { id: "3", role: "assistant" as const, content: "More content" }];
      rerender(<ChatThread messages={next} />);
      expect(screen.getByRole("button", { name: "New messages below" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "New messages below" }));

      expect(geometry.getScrollTop()).toBe(700);
      expect(
        screen.queryByRole("button", { name: "New messages below" }),
      ).not.toBeInTheDocument();
    });

    it("resumes auto-scroll after the user manually scrolls back to the bottom themselves", () => {
      const { rerender } = render(<ChatThread messages={BASE_MESSAGES} />);
      const scroller = getScrollContainer();
      const geometry = mockContainerGeometry(scroller, { scrollTop: 0, clientHeight: 200, scrollHeight: 500 });
      fireEvent.scroll(scroller); // scrolled away

      geometry.setScrollHeight(700);
      rerender(
        <ChatThread
          messages={[...BASE_MESSAGES, { id: "3", role: "assistant", content: "More content" }]}
        />,
      );
      expect(screen.getByRole("button", { name: "New messages below" })).toBeInTheDocument();

      // The user manually scrolls back down themselves (not via the button).
      geometry.setScrollTop(700 - 200);
      fireEvent.scroll(scroller);
      expect(
        screen.queryByRole("button", { name: "New messages below" }),
      ).not.toBeInTheDocument();

      // Now that they're back at the bottom, further content should auto-scroll again.
      geometry.setScrollHeight(900);
      rerender(
        <ChatThread
          messages={[
            ...BASE_MESSAGES,
            { id: "3", role: "assistant", content: "More content" },
            { id: "4", role: "assistant", content: "Even more" },
          ]}
        />,
      );
      expect(geometry.getScrollTop()).toBe(900);
    });
  });

  describe("per-message avatar", () => {
    it("omits the avatar row entirely when no message has avatarFallback (no layout change)", () => {
      const { container } = render(
        <ChatThread messages={[{ id: "1", role: "user", content: "Hi" }]} />,
      );
      expect(container.querySelector('[data-rebar-part="message-row"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-rebar-part="message"]')).toBeInTheDocument();
    });

    it("renders a real Avatar next to a message that has avatarFallback", () => {
      const { container } = render(
        <ChatThread
          messages={[
            { id: "1", role: "user", content: "Hi", avatarFallback: "Jane Doe" },
            { id: "2", role: "assistant", content: "Hello", avatarFallback: "Assistant" },
          ]}
        />,
      );
      const rows = container.querySelectorAll('[data-rebar-part="message-row"]');
      expect(rows).toHaveLength(2);
      expect(container.querySelectorAll('[data-rebar-component="avatar"]')).toHaveLength(2);
    });

    it("renders the real Avatar fallback initials from avatarFallback (jsdom never loads the placeholder image itself — same documented limitation Avatar's own test suite already established)", () => {
      render(
        <ChatThread
          messages={[
            { id: "1", role: "assistant", content: "Hi", avatarFallback: "Ada Lovelace", avatarPlaceholder: true },
          ]}
        />,
      );
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    it("tags the avatar row with the message's role", () => {
      const { container } = render(
        <ChatThread
          messages={[{ id: "1", role: "user", content: "Hi", avatarFallback: "Jane Doe" }]}
        />,
      );
      expect(container.querySelector('[data-rebar-part="message-row"]')).toHaveAttribute(
        "data-rebar-role",
        "user",
      );
    });
  });
});
