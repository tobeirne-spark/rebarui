import { useState } from "react";
import type { ComponentPropsWithoutRef, FormEvent } from "react";
import clsx from "clsx";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Text } from "./Text";
import { Empty } from "./Empty";

export interface CommentThreadComment {
  id: string;
  authorName: string;
  avatarSrc?: string;
  /** Defaults to initials derived from `authorName` when unset. */
  avatarFallback?: string;
  body: string;
  timestamp?: string | Date;
  likeCount?: number;
  /** Whether the current viewer has liked this comment — drives the like button's toggled state. */
  liked?: boolean;
  replies?: CommentThreadComment[];
}

export interface CommentThreadProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  comments: CommentThreadComment[];
  /** Fires with the parent comment's `id` and the typed reply body when a reply is submitted. This
   * is a presentational/controlled component — it does no networking of its own, the caller owns
   * appending the new reply to `comments`, the same convention `ChatThread`'s own `messages` prop
   * already uses. */
  onReply?: (parentId: string, body: string) => void;
  onToggleLike?: (id: string) => void;
  emptyLabel?: string;
  replyLabel?: string;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "");
}

// Comments are commonly days/weeks old (unlike ChatThread's own recent, same-day transcript), so a
// relative "2h ago"/"3d ago" format reads better here than a plain clock time.
function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const ms = date.getTime();
  if (Number.isNaN(ms)) return "";
  const diffSeconds = Math.round((Date.now() - ms) / 1000);
  if (diffSeconds < 60) return "just now";
  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function CommentNode({
  comment,
  depth,
  onReply,
  onToggleLike,
  replyLabel,
}: {
  comment: CommentThreadComment;
  depth: number;
  onReply?: (parentId: string, body: string) => void;
  onToggleLike?: (id: string) => void;
  replyLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const replies = comment.replies ?? [];

  const submitReply = (e: FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onReply?.(comment.id, body);
    setDraft("");
    setReplying(false);
  };

  return (
    <li
      className="rebar-comment-thread-node"
      data-rebar-part="comment"
      data-rebar-depth={depth}
      style={{ marginLeft: depth > 0 ? "var(--rebar-space-lg, 24px)" : 0 }}
    >
      <div className="rebar-comment-thread-row">
        <Avatar
          src={comment.avatarSrc}
          fallback={comment.avatarFallback ?? initials(comment.authorName)}
          size="sm"
        />
        <div className="rebar-comment-thread-body">
          <div className="rebar-comment-thread-meta">
            <Text as="span" style={{ fontWeight: "var(--rebar-font-weight-semibold, 600)" }}>
              {comment.authorName}
            </Text>
            {comment.timestamp ? (
              <Text as="span" size="xs" color="secondary" data-rebar-part="timestamp">
                {formatRelativeTime(comment.timestamp)}
              </Text>
            ) : null}
          </div>
          <Text data-rebar-part="text">{comment.body}</Text>
          <div className="rebar-comment-thread-actions">
            <button
              type="button"
              className="rebar-comment-thread-action"
              data-rebar-part="like"
              aria-pressed={comment.liked || undefined}
              onClick={() => onToggleLike?.(comment.id)}
            >
              {comment.liked ? "♥" : "♡"} {comment.likeCount ?? 0}
            </button>
            <button
              type="button"
              className="rebar-comment-thread-action"
              data-rebar-part="reply-toggle"
              onClick={() => setReplying((r) => !r)}
            >
              {replyLabel}
            </button>
            {replies.length > 0 ? (
              <button
                type="button"
                className="rebar-comment-thread-action"
                data-rebar-part="collapse-toggle"
                onClick={() => setCollapsed((c) => !c)}
              >
                {collapsed ? `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "Hide replies"}
              </button>
            ) : null}
          </div>
          {replying ? (
            <form className="rebar-comment-thread-reply-form" onSubmit={submitReply}>
              <input
                type="text"
                className="rebar-input rebar-comment-thread-reply-input"
                aria-label={`Reply to ${comment.authorName}`}
                placeholder="Write a reply..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                Post
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      {!collapsed && replies.length > 0 ? (
        <ul className="rebar-comment-thread-replies" data-rebar-part="replies">
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onToggleLike={onToggleLike}
              replyLabel={replyLabel}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * A nested-reply discussion thread — real per-comment state (collapsed/expanded, composing a
 * reply), distinct from `ChatThread` (a live, linear messaging surface, not a threaded
 * discussion). The GitHub PR comment / forum thread pattern: replies nest and indent under their
 * parent, each thread can collapse independently, likes toggle per comment.
 */
export function CommentThread({
  comments,
  onReply,
  onToggleLike,
  emptyLabel = "No comments yet",
  replyLabel = "Reply",
  className,
  ...props
}: CommentThreadProps) {
  return (
    <div className={clsx("rebar-comment-thread", className)} data-rebar-component="comment-thread" {...props}>
      {comments.length === 0 ? (
        <Empty description={emptyLabel} />
      ) : (
        <ul className="rebar-comment-thread-list" data-rebar-part="list">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={onReply}
              onToggleLike={onToggleLike}
              replyLabel={replyLabel}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
