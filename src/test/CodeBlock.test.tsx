import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CodeBlock } from "../components/CodeBlock";

describe("CodeBlock", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the code and a data-rebar-component marker", () => {
    const { container } = render(<CodeBlock code="const x = 1;" />);
    expect(container.querySelector('[data-rebar-component="code-block"]')).toBeInTheDocument();
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("renders the language label when provided", () => {
    render(<CodeBlock code="const x = 1;" language="tsx" />);
    expect(screen.getByText("tsx")).toBeInTheDocument();
  });

  it("omits the copy button when hideCopyButton is set", () => {
    render(<CodeBlock code="const x = 1;" hideCopyButton />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("copies the code and shows a confirmation that reverts after 2s", async () => {
    vi.useFakeTimers();
    render(<CodeBlock code="const x = 1;" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders plain preformatted text by default, not styled Markdown", () => {
    const { container } = render(<CodeBlock code={"# Not a heading\n\nJust text"} />);
    expect(container.querySelector("pre")).toBeInTheDocument();
    expect(container.querySelector("h1")).not.toBeInTheDocument();
  });

  it("markdown mode renders headings, paragraphs, lists, and inline formatting as real elements", () => {
    const { container } = render(
      <CodeBlock
        markdown
        code={"# Title\n\nA paragraph with **bold**, *italic*, and `code`.\n\n- one\n- two\n"}
      />,
    );
    expect(container.querySelector('[data-rebar-part="markdown"]')).toBeInTheDocument();
    expect(container.querySelector("pre")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument();
    const paragraph = container.querySelector(".rebar-markdown-paragraph");
    expect(paragraph?.querySelector("strong")).toHaveTextContent("bold");
    expect(paragraph?.querySelector("em")).toHaveTextContent("italic");
    expect(paragraph?.querySelector("code")).toHaveTextContent("code");
    expect(container.querySelectorAll(".rebar-markdown-list li")).toHaveLength(2);
  });

  it("markdown mode renders a fenced code block as a real nested pre/code", () => {
    const { container } = render(<CodeBlock markdown code={"```\nconst x = 1;\n```"} />);
    const fence = container.querySelector(".rebar-markdown-code");
    expect(fence?.tagName.toLowerCase()).toBe("pre");
    expect(fence).toHaveTextContent("const x = 1;");
  });

  it("markdown mode omits the language label (it doesn't apply to rendered Markdown)", () => {
    render(<CodeBlock markdown language="tsx" code="Some text" />);
    expect(screen.queryByText("tsx")).not.toBeInTheDocument();
  });

  it("markdown mode still copies the original raw source, not rendered output", async () => {
    render(<CodeBlock markdown code={"# Title\n\nSome *text*."} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Title\n\nSome *text*.");
  });
});
