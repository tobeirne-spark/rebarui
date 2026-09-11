import { useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { MicIcon, SendPlaneIcon, StopCircleIcon } from "./icons";

export type AiChatInputIntent = "message" | "command" | "search";

const INTENT_CONFIG: Record<AiChatInputIntent, { label: string; placeholder: string }> = {
  message: { label: "Send", placeholder: "Message…" },
  command: { label: "Run", placeholder: "Type a command…" },
  search: { label: "Search", placeholder: "Search…" },
};

export interface AiChatInputProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires on Enter (without Shift) or the primary button — never fires with an empty/
   * whitespace-only value, the same "nothing to actually send" guard a real send button needs
   * regardless of which UI triggered it. */
  onSend?: (value: string) => void;
  /** Overrides `INTENT_CONFIG`'s own default placeholder for the current `intent`. */
  placeholder?: string;
  /**
   * The caller's own inferred intent for whatever's currently typed — this component does no
   * inference itself (a real classifier is a caller/LLM concern, not a UI component's job, the
   * same "report intent, caller owns the real operation" convention `FileManager`'s own `actions`
   * follows), it only changes the primary button's icon/label to match: "message" (default) sends,
   * "command" runs, "search" searches. Real, visibly different behavior driven by whatever
   * inference the caller already has, not a cosmetic label swap for its own sake.
   */
  intent?: AiChatInputIntent;
  /** Shows a dictation (voice-to-text) toggle button. Off by default. This component performs no
   * real recording/transcription itself — same accepted exception as `VoiceComposer`'s own
   * `state`: `dictating` and `onDictationToggle` are the caller's hook to start/stop whatever real
   * speech-to-text they're using, feeding the transcribed text back through `value`/
   * `onValueChange` the same as any typed input. */
  dictation?: boolean;
  dictating?: boolean;
  onDictationToggle?: (active: boolean) => void;
  disabled?: boolean;
  /** Caps how tall the field grows before it scrolls internally instead of growing further.
   * Default `6`. */
  maxRows?: number;
  "aria-label"?: string;
  className?: string;
}

/**
 * A chat message composer distinct from `ChatThread` (which renders an existing conversation, not
 * the compose control) — a multi-line field that grows with its own content, a primary send/run/
 * search button whose icon and label reflect the caller's own inferred intent for what's typed,
 * and an optional dictation toggle. Specific enough to an LLM-chat interaction shape to deserve its
 * own component rather than folding into `ChatThread`; the two compose together (this input below
 * a `ChatThread`) in whatever surrounding chat block a caller builds.
 */
export function AiChatInput({
  value,
  defaultValue = "",
  onValueChange,
  onSend,
  placeholder,
  intent = "message",
  dictation = false,
  dictating = false,
  onDictationToggle,
  disabled,
  maxRows = 6,
  "aria-label": ariaLabel,
  className,
}: AiChatInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internalValue;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setValue = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  // A real, standard auto-grow technique: reset height to measure the content's true scrollHeight,
  // then apply it back up to the maxRows cap — not a fixed `rows` count, which can't track wrapped
  // (not just newline-separated) lines growing the field.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || "20") || 20;
    const maxHeight = lineHeight * maxRows;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [current, maxRows]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const handleSend = () => {
    if (current.trim().length === 0) return;
    onSend?.(current);
    if (!isControlled) setInternalValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const { label, placeholder: defaultPlaceholder } = INTENT_CONFIG[intent];

  return (
    <div className={clsx("rebar-ai-chat-input", className)} data-rebar-component="ai-chat-input" data-rebar-intent={intent}>
      <textarea
        ref={textareaRef}
        className="rebar-input rebar-ai-chat-input-textarea"
        data-rebar-part="textarea"
        value={current}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? defaultPlaceholder}
        disabled={disabled}
        aria-label={ariaLabel ?? "Chat message"}
        rows={1}
      />
      <div className="rebar-ai-chat-input-actions" data-rebar-part="actions">
        {dictation ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => onDictationToggle?.(!dictating)}
            className="rebar-ai-chat-input-dictation-button"
            data-rebar-part="dictation-button"
            data-rebar-active={dictating || undefined}
            aria-label={dictating ? "Stop dictation" : "Start dictation"}
            aria-pressed={dictating}
          >
            {dictating ? <StopCircleIcon aria-hidden="true" /> : <MicIcon aria-hidden="true" />}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled || current.trim().length === 0}
          onClick={handleSend}
          className="rebar-ai-chat-input-send-button"
          data-rebar-part="send-button"
        >
          <SendPlaneIcon aria-hidden="true" />
          <span>{label}</span>
        </Button>
      </div>
    </div>
  );
}
