import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";
import { renderMarkdown } from "../markdown";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Empty } from "./Empty";

export type ChatMessageRole = "user" | "assistant";
export type ChatMessageStatus = "sending" | "sent" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  /** May be a partial/in-progress string while streaming — the caller updates this in place (same
   * array item, same `id`) as chunks arrive; this component never mutates or buffers it itself. */
  content: string;
  status?: ChatMessageStatus;
  timestamp?: string | Date;
  /** An avatar shown beside this message's bubble — omitted entirely (the message renders exactly
   * as it did before this field existed, no layout change) unless `avatarFallback` is passed,
   * matching `Avatar`'s own required `fallback` (used for initials, and — with `avatarPlaceholder`
   * — deterministic portrait selection, so the same name always gets the same portrait). */
  avatarFallback?: string;
  avatarSrc?: string;
  avatarPlaceholder?: boolean;
}

export interface ChatThreadProps extends ComponentPropsWithoutRef<"div"> {
  /** The full transcript so far. This is a presentational/controlled component — it does no
   * networking/streaming of its own; the caller owns the message state and updates `content`
   * in place on the same `id` as streamed chunks arrive, same convention as `FileUpload`
   * (no upload) and `Toast` (no timing) owning none of the async work themselves. */
  messages: ChatMessage[];
  /** Shows a typing indicator bubble (three animated dots) below the last message. */
  isTyping?: boolean;
  /** Fires when the retry affordance on an errored message (`status: "error"`) is clicked. */
  onRetry?: (message: ChatMessage) => void;
  /** Shown instead of the message list when `messages` is empty. Defaults to "Start the
   * conversation" via the real `Empty` component, not a blank scroll area. */
  emptyMessage?: string;
  /** Renders each message's `content` as styled Markdown (headings, lists, blockquotes, fenced
   * code — as a real, embedded `CodeBlock` with its own copy button and language label — and
   * inline bold/italic/code/links) instead of plain text. On by default: real LLM responses
   * (Claude, Qwen, and most others) default to Markdown prose, so this is the common case, not
   * the exception. Set `false` for a transcript that's genuinely plain text (e.g. a support
   * ticket log) where literal `*`/`#`/backtick characters shouldn't be interpreted as markup. */
  markdown?: boolean;
  /** Force bionic reading on/off for every message's content, overriding the ambient
   * data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/** How close to the real bottom (in px) still counts as "at the bottom" for auto-scroll and for
 * hiding the "new messages below" affordance — a small tolerance, not an exact 0, since a
 * sub-pixel layout rounding difference shouldn't be read as "the user scrolled away." */
const AT_BOTTOM_THRESHOLD_PX = 48;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isAtBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_THRESHOLD_PX;
}

/** A cheap, order-and-content-sensitive fingerprint of the transcript — not a deep-equal, just
 * enough to notice "something actually changed" (a new message arrived, or an existing one's
 * `content` grew while streaming) without re-running the auto-scroll decision on every render
 * that happens to pass an equivalent-looking `messages` array. */
function messagesSignature(messages: ChatMessage[], isTyping: boolean | undefined): string {
  return (
    messages.map((m) => `${m.id}:${m.content.length}:${m.status ?? ""}`).join("|") +
    (isTyping ? "|typing" : "")
  );
}

function formatTimestamp(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div
      className="rebar-chat-message rebar-chat-message-assistant"
      data-rebar-part="typing-indicator"
      data-rebar-role="assistant"
    >
      <div className="rebar-chat-typing-bubble" role="status" aria-label="Assistant is typing">
        <span className="rebar-chat-typing-dot" />
        <span className="rebar-chat-typing-dot" />
        <span className="rebar-chat-typing-dot" />
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onRetry,
  bionic,
  bionicOptions,
  markdown = true,
}: {
  message: ChatMessage;
  onRetry?: (message: ChatMessage) => void;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  markdown?: boolean;
}) {
  // Called unconditionally (a real hook — state/effects inside) regardless of whether `bionic`
  // ends up overriding it below; short-circuiting this call would violate the rules of hooks.
  const ambientBionic = useAmbientBionic();
  // One resolved boolean shared by both rendering paths below — `renderMarkdown` has no
  // ambient-attribute awareness of its own, so it needs this resolved explicitly rather than a
  // raw, possibly-undefined `bionic` prop.
  const bionicEnabled = bionic ?? ambientBionic;
  const plainContent = renderBionicChildren(message.content, bionicEnabled, bionicOptions);
  const status = message.status ?? "sent";
  const isError = status === "error";

  const bubble = (
    <div
      className={clsx("rebar-chat-message", `rebar-chat-message-${message.role}`)}
      data-rebar-part="message"
      data-rebar-role={message.role}
      data-rebar-status={status}
    >
      <div className="rebar-chat-message-bubble" data-rebar-part="bubble">
        {markdown ? (
          <div className="rebar-chat-message-content" data-rebar-part="content">
            {renderMarkdown(message.content, { bionic: bionicEnabled, bionicOptions })}
          </div>
        ) : (
          <span className="rebar-chat-message-content" data-rebar-part="content">
            {plainContent}
          </span>
        )}
        {status === "streaming" ? (
          <span className="rebar-chat-message-cursor" data-rebar-part="cursor" aria-hidden="true" />
        ) : null}
      </div>
      <div className="rebar-chat-message-meta" data-rebar-part="meta">
        {message.timestamp ? (
          <span className="rebar-chat-message-timestamp" data-rebar-part="timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
        ) : null}
        {status === "sending" ? (
          <span className="rebar-chat-message-pending" data-rebar-part="pending">
            Sending…
          </span>
        ) : null}
        {isError ? (
          <span className="rebar-chat-message-error-text" data-rebar-part="error-text">
            Failed to send
          </span>
        ) : null}
      </div>
      {isError ? (
        <Button
          type="button"
          variant="destructive"
          className="rebar-chat-message-retry"
          data-rebar-part="retry-button"
          onClick={() => onRetry?.(message)}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );

  // Omitted entirely (no wrapping row, no layout change at all) unless `avatarFallback` is
  // passed — a transcript with no avatars renders exactly as it did before this field existed.
  if (!message.avatarFallback) return bubble;

  return (
    <div
      className="rebar-chat-message-row"
      data-rebar-part="message-row"
      data-rebar-role={message.role}
    >
      <Avatar
        fallback={message.avatarFallback}
        src={message.avatarSrc}
        placeholder={message.avatarPlaceholder}
        size="sm"
        alt=""
      />
      {bubble}
    </div>
  );
}

/**
 * A chat-bubble message thread — the caller owns all networking/streaming and passes in message
 * state (same controlled-presentation convention as `FileUpload`/`Toast`). The one genuinely
 * non-trivial piece of behavior this component owns: deciding whether to auto-scroll on new
 * content or leave the user alone.
 *
 * That decision works off a ref (`atBottomRef`), not React state, because it has to be read
 * synchronously the instant new content lands — by the time a state update from the last scroll
 * event would have re-rendered, the new message may already be in `messages`. A real `scroll`
 * listener on the message container keeps the ref current; a `useLayoutEffect` keyed on the
 * transcript's own signature (see `messagesSignature`) checks it *after* the DOM has the new
 * content but *before* the browser paints, so the auto-scroll (when it happens) never flashes the
 * old scroll position first. If the user has scrolled away from the bottom when new content
 * arrives, this never yanks them back — instead it surfaces the floating "new messages below"
 * button, which itself scrolls to bottom and resumes auto-scroll on click.
 */
export const ChatThread = forwardRef<HTMLDivElement, ChatThreadProps>(function ChatThread(
  { messages, isTyping, onRetry, emptyMessage, bionic, bionicOptions, markdown = true, className, ...props },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prevSignatureRef = useRef("");
  const [hasNewContent, setHasNewContent] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = isAtBottom(el);
    atBottomRef.current = atBottom;
    if (atBottom) setHasNewContent(false);
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const signature = messagesSignature(messages, isTyping);
    if (signature === prevSignatureRef.current) return;
    prevSignatureRef.current = signature;

    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    } else {
      setHasNewContent(true);
    }
  });

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    atBottomRef.current = true;
    setHasNewContent(false);
  };

  return (
    <div ref={ref} className={clsx("rebar-chat-thread", className)} data-rebar-component="chat-thread" {...props}>
      {messages.length === 0 ? (
        <Empty description={emptyMessage ?? "Start the conversation"} />
      ) : (
        <>
          <div
            ref={scrollRef}
            className="rebar-chat-thread-scroll"
            data-rebar-part="scroll"
            onScroll={handleScroll}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={onRetry}
                bionic={bionic}
                bionicOptions={bionicOptions}
                markdown={markdown}
              />
            ))}
            {isTyping ? <TypingIndicator /> : null}
          </div>
          {hasNewContent ? (
            <button
              type="button"
              className="rebar-chat-thread-scroll-to-bottom"
              data-rebar-part="scroll-to-bottom"
              onClick={scrollToBottom}
              aria-label="New messages below"
            >
              ↓ New messages
            </button>
          ) : null}
        </>
      )}
    </div>
  );
});
