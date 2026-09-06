import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Spin } from "./Spin";
import { Progress } from "./Progress";
import { Select } from "./Select";
import { Slider } from "./Slider";

export type TtsState = "idle" | "generating" | "playing" | "paused" | "error";

export interface TtsVoiceOption {
  id: string;
  label: string;
}

export interface TextToSpeechBarProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * The single source of truth for playback state. Deliberately no internal/uncontrolled
   * fallback (unlike a value/selection prop) — this component performs no speech synthesis
   * itself, whether via the browser `SpeechSynthesis` API, a server call, or a local model, so
   * there's no sensible default state it could own on its own. Same accepted exception as
   * `FileUpload`'s `files` prop: the caller is the only possible source of truth.
   */
  state: TtsState;
  /** Playback position 0-100, if the caller knows it. Renders a real `Progress` bar when set. */
  progress?: number;
  /** "idle" (or "error", as a retry) -> start generating audio for the current text. */
  onGenerate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  /** Shown as real visible text in the "error" state, not just logged or silently swallowed. */
  errorMessage?: string;
  /** Optional voice picker. Only rendered when a non-empty list is actually supplied. */
  voices?: TtsVoiceOption[];
  selectedVoiceId?: string;
  onVoiceChange?: (voiceId: string) => void;
  /** e.g. 0.5-2.0. Only meaningful (and only rendered) alongside `onSpeedChange`. */
  speed?: number;
  /** Optional speed slider. Only rendered when actually supplied — not every caller wants one. */
  onSpeedChange?: (speed: number) => void;
}

/** The real `aria-live="polite"` announcement per state — heuristic #1 (visibility of system
 * status): an async transition like this needs to reach a non-visual user, not just swap an icon. */
function getStatusMessage(state: TtsState, errorMessage?: string): string {
  switch (state) {
    case "idle":
      return "Ready to generate audio.";
    case "generating":
      return "Generating audio…";
    case "playing":
      return "Playing";
    case "paused":
      return "Paused";
    case "error":
      return errorMessage ? `Error: ${errorMessage}` : "Something went wrong generating audio.";
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
  state: TtsState,
  onGenerate: () => void,
  onPlay: () => void,
  onPause: () => void,
): MainButtonConfig {
  switch (state) {
    case "generating":
      return { label: "Generating…", glyph: "", disabled: true };
    case "playing":
      return { label: "Pause", glyph: "⏸", onClick: onPause };
    case "paused":
      return { label: "Play", glyph: "▶", onClick: onPlay };
    case "error":
      return { label: "Retry", glyph: "↻", onClick: onGenerate };
    case "idle":
    default:
      return { label: "Generate", glyph: "▶", onClick: onGenerate };
  }
}

/**
 * A stateful control bar for text-to-speech playback. Presentational only, same "caller owns the
 * real work" convention `FileUpload` follows for uploads: this component never performs speech
 * synthesis itself (browser `SpeechSynthesis`, a server call, a local model — any of those is the
 * caller's job), it only renders `state` and calls back out on interaction.
 */
export const TextToSpeechBar = forwardRef<HTMLDivElement, TextToSpeechBarProps>(
  function TextToSpeechBar(
    {
      state,
      progress,
      onGenerate,
      onPlay,
      onPause,
      onStop,
      errorMessage,
      voices,
      selectedVoiceId,
      onVoiceChange,
      speed = 1,
      onSpeedChange,
      className,
      ...props
    },
    ref,
  ) {
    const showStop = state === "playing" || state === "paused";
    const showVoicePicker = voices !== undefined && voices.length > 0;
    const showSpeedSlider = onSpeedChange !== undefined;
    const mainButton = getMainButtonConfig(state, onGenerate, onPlay, onPause);

    return (
      <div
        ref={ref}
        className={clsx("rebar-tts-bar", className)}
        data-rebar-component="text-to-speech-bar"
        data-rebar-state={state}
        {...props}
      >
        <div className="rebar-tts-bar-controls" data-rebar-part="controls">
          <Button
            type="button"
            onClick={mainButton.onClick}
            disabled={mainButton.disabled}
            className="rebar-tts-bar-main-button"
            data-rebar-part="main-button"
            data-rebar-state={state}
          >
            {state === "generating" ? (
              <Spin spinning size="sm" className="rebar-tts-bar-spin" />
            ) : (
              <span aria-hidden="true">{mainButton.glyph}</span>
            )}
            <span>{mainButton.label}</span>
          </Button>

          {showStop ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onStop}
              className="rebar-tts-bar-stop-button"
              data-rebar-part="stop-button"
            >
              <span aria-hidden="true">⏹</span>
              <span>Stop</span>
            </Button>
          ) : null}

          {showVoicePicker ? (
            <div className="rebar-tts-bar-voice" data-rebar-part="voice-select">
              <label className="rebar-tts-bar-label">Voice</label>
              <Select
                options={voices!.map((voice) => ({ value: voice.id, label: voice.label }))}
                value={selectedVoiceId}
                onValueChange={onVoiceChange}
                placeholder="Choose a voice"
                aria-label="Voice"
              />
            </div>
          ) : null}

          {showSpeedSlider ? (
            <div className="rebar-tts-bar-speed" data-rebar-part="speed-slider">
              <label className="rebar-tts-bar-label">Speed: {speed.toFixed(1)}x</label>
              <Slider
                value={speed}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={onSpeedChange}
                aria-label="Playback speed"
              />
            </div>
          ) : null}
        </div>

        {progress !== undefined ? (
          <div className="rebar-tts-bar-progress" data-rebar-part="progress">
            <Progress value={progress} aria-label="Playback progress" />
          </div>
        ) : null}

        {state === "error" ? (
          <p className="rebar-tts-bar-error" data-rebar-part="error-message">
            {errorMessage ?? "Something went wrong generating audio."}
          </p>
        ) : null}

        <span className="rebar-tts-bar-status" data-rebar-part="status" aria-live="polite">
          {getStatusMessage(state, errorMessage)}
        </span>
      </div>
    );
  },
);
