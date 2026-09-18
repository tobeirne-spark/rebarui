import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentThread } from "../components/CommentThread";
import type { CommentThreadComment } from "../components/CommentThread";

const COMMENTS: CommentThreadComment[] = [
  {
    id: "c1",
    authorName: "Ada Lovelace",
    body: "This is a great proposal.",
    likeCount: 2,
    replies: [
      { id: "c1-r1", authorName: "Alan Turing", body: "Agreed.", likeCount: 0 },
    ],
  },
  { id: "c2", authorName: "Grace Hopper", body: "One concern about scope.", likeCount: 0 },
];

describe("CommentThread", () => {
  it("carries data-rebar-component on the root", () => {
    render(<CommentThread comments={COMMENTS} />);
    expect(document.querySelector('[data-rebar-component="comment-thread"]')).not.toBeNull();
  });

  it("renders every top-level comment and its body text", () => {
    render(<CommentThread comments={COMMENTS} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("This is a great proposal.")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  it("renders nested replies indented under their parent", () => {
    const { container } = render(<CommentThread comments={COMMENTS} />);
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    const reply = container.querySelector('[data-rebar-depth="1"]');
    expect(reply).not.toBeNull();
  });

  it("shows the empty state when there are no comments", () => {
    render(<CommentThread comments={[]} emptyLabel="Be the first to comment" />);
    expect(screen.getByText("Be the first to comment")).toBeInTheDocument();
  });

  it("calls onToggleLike with the comment's id", async () => {
    const user = userEvent.setup();
    const onToggleLike = vi.fn();
    render(<CommentThread comments={COMMENTS} onToggleLike={onToggleLike} />);
    await user.click(screen.getByText("♡ 2"));
    expect(onToggleLike).toHaveBeenCalledWith("c1");
  });

  it("shows a filled heart and aria-pressed once liked", () => {
    const liked: CommentThreadComment[] = [{ id: "c1", authorName: "Ada", body: "Hi", likeCount: 1, liked: true }];
    render(<CommentThread comments={liked} />);
    const likeButton = screen.getByText("♥ 1");
    expect(likeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("opens a reply form, submits it, and clears the draft", async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    render(<CommentThread comments={COMMENTS} onReply={onReply} />);

    const replyButtons = screen.getAllByText("Reply");
    await user.click(replyButtons[0]!);

    const input = screen.getByRole("textbox", { name: "Reply to Ada Lovelace" });
    await user.type(input, "Thanks!");
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(onReply).toHaveBeenCalledWith("c1", "Thanks!");
    expect(screen.queryByRole("textbox", { name: "Reply to Ada Lovelace" })).not.toBeInTheDocument();
  });

  it("disables Post until the draft has real content", async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={COMMENTS} onReply={vi.fn()} />);
    await user.click(screen.getAllByText("Reply")[0]!);
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Reply to Ada Lovelace" }), "  ");
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
  });

  it("collapses and re-expands a comment's replies", async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={COMMENTS} />);

    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    await user.click(screen.getByText("Hide replies"));
    expect(screen.queryByText("Alan Turing")).not.toBeInTheDocument();

    await user.click(screen.getByText("Show 1 reply"));
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
  });

  it("omits the collapse toggle for a comment with no replies", () => {
    render(<CommentThread comments={COMMENTS} />);
    const graceRow = screen.getByText("Grace Hopper").closest('[data-rebar-part="comment"]')!;
    expect(graceRow.querySelector('[data-rebar-part="collapse-toggle"]')).toBeNull();
  });
});
