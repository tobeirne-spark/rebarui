import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("prompts for a URL and a label, then inserts a real anchor with that label", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt")
      .mockReturnValueOnce("https://example.com") // URL prompt
      .mockReturnValueOnce("Example site"); // label prompt
    render(<RichTextEditor />);
    await user.click(screen.getByRole("button", { name: "Insert link" }));
    expect(document.execCommand).toHaveBeenCalledWith(
      "insertHTML",
      false,
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example site</a>',
    );
  });

  it("does not insert a link when the URL prompt is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt").mockReturnValue(null);
    render(<RichTextEditor />);
    await user.click(screen.getByRole("button", { name: "Insert link" }));
    expect(document.execCommand).not.toHaveBeenCalledWith("insertHTML", false, expect.anything());
  });

  it("does not insert a link when the label prompt is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "prompt")
      .mockReturnValueOnce("https://example.com")
      .mockReturnValueOnce(null);
    render(<RichTextEditor />);
    await user.click(screen.getByRole("button", { name: "Insert link" }));
    expect(document.execCommand).not.toHaveBeenCalledWith("insertHTML", false, expect.anything());
  });

  it("opens a link in a new tab when clicked inside the editor, instead of just placing the caret", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<RichTextEditor value='<a href="https://example.com">Example</a>' />);
    const link = container.querySelector("a")!;
    fireEvent.click(link);
    expect(openSpy).toHaveBeenCalledWith("https://example.com/", "_blank", "noopener,noreferrer");
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

  describe("image insertion", () => {
    it("inserts an image picked via the toolbar's file input as a base64 data URL", async () => {
      const { container } = render(<RichTextEditor />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["fake-image-bytes"], "photo.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() =>
        expect(document.execCommand).toHaveBeenCalledWith("insertHTML", false, expect.stringMatching(/^<img src="data:image\/png;base64,/)),
      );
    });

    it("inserts a pasted image, marking the paste event's default behavior prevented", async () => {
      const { container } = render(<RichTextEditor />);
      const content = container.querySelector('[data-rebar-part="content"]') as HTMLElement;
      const file = new File(["fake-image-bytes"], "clip.png", { type: "image/png" });
      let observedEvent: Event | undefined;
      content.addEventListener("paste", (e) => (observedEvent = e));
      fireEvent.paste(content, { clipboardData: { items: [{ type: "image/png", getAsFile: () => file }] } });

      expect(observedEvent?.defaultPrevented).toBe(true);
      await waitFor(() => expect(document.execCommand).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("<img")));
    });

    it("ignores a plain-text paste", async () => {
      const { container } = render(<RichTextEditor />);
      const content = container.querySelector('[data-rebar-part="content"]') as HTMLElement;
      fireEvent.paste(content, { clipboardData: { items: [{ type: "text/plain", getAsFile: () => null }] } });
      expect(document.execCommand).not.toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("<img"));
    });

    it("rejects an image over maxImageBytes without inserting it", async () => {
      render(<RichTextEditor maxImageBytes={10} />);
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const fileInput = screen.getByRole("toolbar").querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["this string is definitely over ten bytes"], "big.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(alertSpy).toHaveBeenCalled();
      expect(document.execCommand).not.toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("<img"));
    });
  });
});
