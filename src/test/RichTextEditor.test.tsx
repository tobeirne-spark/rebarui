import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichTextEditor } from "../components/RichTextEditor";

// jsdom doesn't implement document.execCommand (a real-browser-only rich-editing API) — stub it
// so clicking a toolbar button doesn't throw, and so tests can assert it was invoked with the
// right command name, the same "polyfill the specific jsdom gap" convention this project's other
// drag/pointer-event tests already use.
beforeEach(() => {
  document.execCommand = vi.fn().mockReturnValue(true);
});

describe("RichTextEditor", () => {
  it("renders a toolbar and a real contentEditable region", () => {
    const { container } = render(<RichTextEditor />);
    expect(container.querySelector('[data-rebar-component="rich-text-editor"]')).toBeInTheDocument();
    const content = container.querySelector('[data-rebar-part="content"]');
    expect(content).toHaveAttribute("contenteditable", "true");
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("runs the right execCommand for each toolbar button", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor />);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(document.execCommand).toHaveBeenCalledWith("bold", false);
    await user.click(screen.getByRole("button", { name: "Bulleted list" }));
    expect(document.execCommand).toHaveBeenCalledWith("insertUnorderedList", false);
  });

  it("prompts for a URL and inserts a link", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue("https://example.com");
    render(<RichTextEditor />);
    await user.click(screen.getByRole("button", { name: "Insert link" }));
    expect(document.execCommand).toHaveBeenCalledWith("createLink", false, "https://example.com");
  });

  it("does not insert a link when the URL prompt is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    render(<RichTextEditor />);
    await user.click(screen.getByRole("button", { name: "Insert link" }));
    expect(document.execCommand).not.toHaveBeenCalledWith("createLink", false, expect.anything());
  });

  it("fires onValueChange with the editor's real HTML on input", () => {
    const onValueChange = vi.fn();
    const { container } = render(<RichTextEditor onValueChange={onValueChange} />);
    const content = container.querySelector('[data-rebar-part="content"]') as HTMLElement;
    content.innerHTML = "<p>Hello</p>";
    fireEvent.input(content);
    expect(onValueChange).toHaveBeenCalledWith("<p>Hello</p>");
  });

  it("shows the placeholder via a data attribute when empty", () => {
    const { container } = render(<RichTextEditor placeholder="Write something..." />);
    const content = container.querySelector('[data-rebar-part="content"]');
    expect(content).toHaveAttribute("data-placeholder", "Write something...");
  });

  it("syncs a controlled value into the DOM without clobbering it when unchanged", () => {
    const { container, rerender } = render(<RichTextEditor value="<p>One</p>" />);
    const content = container.querySelector('[data-rebar-part="content"]') as HTMLElement;
    expect(content.innerHTML).toBe("<p>One</p>");

    rerender(<RichTextEditor value="<p>Two</p>" />);
    expect(content.innerHTML).toBe("<p>Two</p>");
  });

  it("respects minHeight", () => {
    const { container } = render(<RichTextEditor minHeight={300} />);
    const content = container.querySelector('[data-rebar-part="content"]') as HTMLElement;
    expect(content.style.minHeight).toBe("300px");
  });
});
