import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildTruncated, Ellipsis } from "../components/Ellipsis";

afterEach(cleanup);

describe("buildTruncated", () => {
  const content = "abcdefghij";

  it("returns the full content unchanged once keep reaches its length", () => {
    expect(buildTruncated(content, 10, "end")).toBe(content);
    expect(buildTruncated(content, 20, "end")).toBe(content);
  });

  it("direction='end' keeps the first N chars and appends an ellipsis", () => {
    expect(buildTruncated(content, 4, "end")).toBe("abcd…");
  });

  it("direction='start' keeps the last N chars and prepends an ellipsis", () => {
    expect(buildTruncated(content, 4, "start")).toBe("…ghij");
  });

  it("direction='middle' splits the kept chars across the front and back, ellipsis in between", () => {
    expect(buildTruncated(content, 4, "middle")).toBe("ab…ij");
  });

  it("keep<=0 collapses to a bare ellipsis", () => {
    expect(buildTruncated(content, 0, "end")).toBe("…");
  });
});

describe("Ellipsis", () => {
  // jsdom reports every element's scrollHeight as 0, so the real measure-and-truncate effect
  // can never detect overflow in a unit test — content always renders in full here, the same
  // documented limitation NoticeBar's own marquee-measurement tests already accept. The
  // truncation math itself is covered directly above, against the real `buildTruncated`.
  it("renders the full content (jsdom can't measure real overflow)", () => {
    render(<Ellipsis content="Some short text" />);
    expect(screen.getByText("Some short text")).toBeInTheDocument();
  });

  it("renders no expand/collapse button when content isn't measured as overflowing", () => {
    render(<Ellipsis content="Some short text" expandText="More" collapseText="Less" />);
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Less" })).not.toBeInTheDocument();
  });

  it("calls onContentClick when the rendered text is clicked", async () => {
    const user = userEvent.setup();
    const onContentClick = vi.fn();
    render(<Ellipsis content="Some short text" onContentClick={onContentClick} />);
    await user.click(screen.getByText("Some short text"));
    expect(onContentClick).toHaveBeenCalled();
  });

  it("accepts controlled open/onOpenChange without throwing", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Ellipsis content="Some short text" open={false} onOpenChange={onOpenChange} />);
    rerender(<Ellipsis content="Some short text" open onOpenChange={onOpenChange} />);
    expect(screen.getByText("Some short text")).toBeInTheDocument();
  });
});
