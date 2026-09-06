import { forwardRef } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Spin } from "./Spin";

export type VoiceComposerState = "idle" | "recording" | "transcribing" | "ready" | "error";

export interface VoiceComposerProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * The single source of truth for where the voice message stands. Deliberately no internal/
   * uncontrolled fallback (unlike a value/selection prop) — this component performs no real audio
   * recording or transcription itself (no `MediaRecorder` wiring in here), so there's no sensible
   * default state it could own on its own. Same accepted exception as `FileUpload`'s `files` prop
   * and `TextToSpeechBar`'s own `state`: the caller is the only possible source of truth.
   */
  state: VoiceComposerState;
  /** The live interim transcript while recording, or the finalized draft once "ready". Rendered in
   * a real, editable `<textarea>` — not read-only — so a caller can let the user hand-correct it. */
  draftText?: string;
  /** Fires on every keystroke in the draft textarea (available while `state` is "recording" or
   * "ready"). */
  onDraftTextChange?: (text: string) => void;
  /** Recording duration so far, in seconds. Rendered as a live `mm:ss` readout while recording. */
  elapsedSeconds?: number;
  /** "idle" or "error" (as a retry) -> the caller starts a real recording. */
  onStartRecording: () => void;
  /** "recording" -> the caller stops recording and moves to "transcribing". */
  onStopRecording: () => void;
  /** "ready" -> send the final `draftText`. */
  onSend: () => void;
  /** Discard and return to "idle", available from any non-idle state. */
  onCancel: () => void;
  /** Shown as real visible text in the "error" state, not just logged or silently swallowed. */
  errorMessage?: string;
}

/** `125` -> `"02:05"`. Guards against a negative/undefined/fractional input rather than ever
 * rendering "NaN:NaN" or a half-second. */
function formatElapsed(seconds: number | undefined): string {
  const total = Math.max(0, Math.floor(seconds ?? 0));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** The real aria-live="polite" announcement per state — heuristic #1 (visibility of system
 * status): an async transition like this needs to reach a non-visual user, not just an icon swap
 * and a pulsing dot. */
function getStatusMessage(state: VoiceComposerState, errorMessage?: string): string {
  switch (state) {
    case "idle":
      return "Ready to record.";
    case "recording":
      return "Recording";
    case "transcribing":
      return "Transcribing…";
    case "ready":
      return "Ready to send";
    case "error":
      return errorMessage ? `Error: ${errorMessage}` : "Something went wrong recording.";
    default:
      return "";
  }
}

interface MainButtonConfig {
  label: string;
  glyph: string;
  onClick?: () => void;
  disabled?: boolean;
}

function getMainButtonConfig(
  state: VoiceComposerState,
  onStartRecording: () => void,
  onStopRecording: () => void,
  onSend: () => void,
): MainButtonConfig {
  switch (state) {
    case "recording":
      return { label: "Stop", glyph: "⏹", onClick: onStopRecording };
    case "transcribing":
      return { label: "Transcribing…", glyph: "", disabled: true };
    case "ready":
      return { label: "Send", glyph: "➤", onClick: onSend };
    case "error":
      return { label: "Retry", glyph: "🎙", onClick: onStartRecording };
    case "idle":
    default:
      return { label: "Record", glyph: "🎙", onClick: onStartRecording };
  }
}

/**
 * A record/send button that morphs between mic/stop/spinner/send icon states, with a live-
 * updating draft transcript shown while recording. Presentational only, same "caller owns the
 * real work" convention `FileUpload` (no upload) and `TextToSpeechBar` (no speech synthesis)
 * already follow: this component never touches `MediaRecorder` or any transcription backend
 * itself — it only renders `state` and calls back out on interaction, which keeps it testable in
 * jsdom and reusable regardless of which recording/transcription stack a consumer wires up.
 */
export const VoiceComposer = forwardRef<HTMLDivElement, VoiceComposerProps>(function VoiceComposer(
  {
    state,
    draftText,
    onDraftTextChange,
    elapsedSeconds,
    onStartRecording,
    onStopRecording,
    onSend,
    onCancel,
    errorMessage,
    className,
    ...props
  },
  ref,
) {
  const showCancel = state !== "idle";
  const showDraft = state === "recording" || state === "ready";
  const mainButton = getMainButtonConfig(state, onStartRecording, onStopRecording, onSend);

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onDraftTextChange?.(event.target.value);
  };

  return (
    <div
      ref={ref}
      className={clsx("rebar-voice-composer", className)}
      data-rebar-component="voice-composer"
      data-rebar-state={state}
      {...props}
    >
      <div className="rebar-voice-composer-controls" data-rebar-part="controls">
        <Button
          type="button"
          onClick={mainButton.onClick}
          disabled={mainButton.disabled}
          className="rebar-voice-composer-main-button"
          data-rebar-part="main-button"
          data-rebar-state={state}
        >
          {state === "transcribing" ? (
            <Spin spinning size="sm" className="rebar-voice-composer-spin" />
          ) : (
            <span aria-hidden="true">{mainButton.glyph}</span>
          )}
          <span>{mainButton.label}</span>
        </Button>

        {state === "recording" ? (
          <span className="rebar-voice-composer-elapsed" data-rebar-part="elapsed-time">
            <span
              className="rebar-voice-composer-recording-dot"
              data-rebar-part="recording-indicator"
              aria-hidden="true"
            />
            {formatElapsed(elapsedSeconds)}
          </span>
        ) : null}

        {showCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="rebar-voice-composer-cancel-button"
            data-rebar-part="cancel-button"
          >
            <span aria-hidden="true">×</span>
            <span>Cancel</span>
          </Button>
        ) : null}
      </div>

      {showDraft ? (
        <div className="rebar-voice-composer-draft" data-rebar-part="draft-wrapper">
          {state === "recording" ? (
            <p className="rebar-voice-composer-caption" data-rebar-part="draft-caption">
              Transcribing as you speak…
            </p>
          ) : null}
          <textarea
            className={clsx(
              "rebar-input",
              "rebar-voice-composer-textarea",
              state === "recording" && "rebar-voice-composer-textarea-live",
            )}
            data-rebar-part="draft-textarea"
            data-rebar-state={state}
            value={draftText ?? ""}
            onChange={handleDraftChange}
            aria-label={state === "recording" ? "Live transcript" : "Draft message"}
            rows={3}
          />
        </div>
      ) : null}

      {state === "error" ? (
        <p className="rebar-voice-composer-error" data-rebar-part="error-message">
          {errorMessage ?? "Something went wrong recording."}
        </p>
      ) : null}

      <span className="rebar-voice-composer-status" data-rebar-part="status" aria-live="polite">
        {getStatusMessage(state, errorMessage)}
      </span>
    </div>
  );
});
