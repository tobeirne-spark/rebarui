import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiChatInput } from "../components/AiChatInput";

afterEach(cleanup);

describe("AiChatInput", () => {
  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<AiChatInput />);
    expect(container.querySelector('[data-rebar-component="ai-chat-input"]')).toBeInTheDocument();
  });

  it("typing updates the value uncontrolled, and Enter sends + clears it", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AiChatInput onSend={onSend} />);
    const textarea = screen.getByRole("textbox", { name: "Chat message" });
    await user.type(textarea, "Hello there{Enter}");
    expect(onSend).toHaveBeenCalledWith("Hello there");
    expect(textarea).toHaveValue("");
  });

  it("Shift+Enter inserts a newline instead of sending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AiChatInput onSend={onSend} />);
    const textarea = screen.getByRole("textbox", { name: "Chat message" });
    await user.type(textarea, "line one{Shift>}{Enter}{/Shift}line two");
    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("line one\nline two");
  });

  it("does not send an empty or whitespace-only value, via Enter or the button", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AiChatInput onSend={onSend} defaultValue="   " />);
    await user.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("the send button is disabled while empty and enabled once there's real content", async () => {
    const user = userEvent.setup();
    render(<AiChatInput />);
    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Chat message" }), "hi");
    expect(button).not.toBeDisabled();
  });

  it("is controlled when value is passed — sending doesn't clear it without the caller feeding it back", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const onValueChange = vi.fn();
    render(<AiChatInput value="fixed text" onValueChange={onValueChange} onSend={onSend} />);
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledWith("fixed text");
    expect(screen.getByRole("textbox", { name: "Chat message" })).toHaveValue("fixed text");
  });

  it("intent changes the primary button's label and the default placeholder", () => {
    const { rerender } = render(<AiChatInput intent="message" />);
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Message…")).toBeInTheDocument();

    rerender(<AiChatInput intent="command" />);
    expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a command…")).toBeInTheDocument();

    rerender(<AiChatInput intent="search" />);
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });

  it("an explicit placeholder overrides the intent's own default", () => {
    render(<AiChatInput intent="message" placeholder="Ask anything" />);
    expect(screen.getByPlaceholderText("Ask anything")).toBeInTheDocument();
  });

  it("omits the dictation button by default, shows it when dictation is set", () => {
    const { rerender } = render(<AiChatInput />);
    expect(screen.queryByRole("button", { name: "Start dictation" })).not.toBeInTheDocument();
    rerender(<AiChatInput dictation />);
    expect(screen.getByRole("button", { name: "Start dictation" })).toBeInTheDocument();
  });

  it("clicking the dictation button fires onDictationToggle with the toggled state", async () => {
    const user = userEvent.setup();
    const onDictationToggle = vi.fn();
    render(<AiChatInput dictation dictating={false} onDictationToggle={onDictationToggle} />);
    await user.click(screen.getByRole("button", { name: "Start dictation" }));
    expect(onDictationToggle).toHaveBeenCalledWith(true);
  });

  it("dictating=true shows a real toggled state: aria-pressed, a different label, and aria-label", () => {
    render(<AiChatInput dictation dictating />);
    const button = screen.getByRole("button", { name: "Stop dictation" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("disabled disables both the textarea and the send button", () => {
    render(<AiChatInput disabled defaultValue="hi" />);
    expect(screen.getByRole("textbox", { name: "Chat message" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
