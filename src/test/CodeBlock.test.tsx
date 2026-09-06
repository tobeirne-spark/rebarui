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
});
