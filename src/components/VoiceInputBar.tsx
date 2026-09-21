import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { CameraIcon, KeyboardIcon } from "./icons-remix";
import { MicIcon } from "./icons";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export type VoiceInputBarState = "idle" | "listening" | "speaking" | "processing";

export interface VoiceInputBarProps extends Omit<ComponentPropsWithoutRef<"div">, "onClick"> {
  /**
   * The single source of truth for the capture state. Deliberately no internal/uncontrolled
   * fallback — this component performs no real microphone/audio-level capture itself (no
   * `MediaRecorder`/`AnalyserNode` wiring in here), so there's no sensible default it could own on
   * its own. Same accepted exception as `VoiceComposer`'s and `TextToSpeechBar`'s own `state`.
   */
  state: VoiceInputBarState;
  /** Tap/click on the large center mic button — typically starts capture from "idle", or stops it
   * from "listening". */
  onMicPress?: () => void;
  /** The left-side keyboard-glyph button — switches back to a text composer. Omit both this and
   * `showKeyboardToggle={false}` to hide the button entirely rather than render a dead control. */
  onKeyboardToggle?: () => void;
  /** The right-side camera button — attach/capture an image alongside voice input. */
  onCameraPress?: () => void;
  /** Show the keyboard-toggle button. Default true. */
  showKeyboardToggle?: boolean;
  /** Show the camera button. Default true. */
  showCamera?: boolean;
  /** Glow/waveform/mic-button color. Defaults to the library's own `--rebar-color-primary` (blue
   * in the default theme) — same convention as `FloatAssistant`'s own `accentColor`, which is
   * exactly what it passes down when it renders this as its voice-mode input, so the two stay in
   * sync without the caller having to set it twice. */
  accentColor?: string;
  /** Overrides the default per-state status line ("Listening…"/"Speaking…"/"Processing…", blank
   * while idle). */
  statusText?: string;
  /** How many bars to render across the waveform. Default 32. */
  barCount?: number;
  /** Deterministic seed for the waveform's bar heights/phases (see `generateBarProfile` below) —
   * the same seed always renders the same-looking waveform rather than reshuffling on every
   * mount, matching `WaveformAudioPlayer`'s own convention. Default "voice-input-bar". */
  seed?: string;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  className?: string;
}

// Same seeded-hash technique as `WaveformAudioPlayer`/Sticky's rotation pick/Avatar's placeholder
// selection — never `Math.random`, so a given `seed` always renders the same-looking waveform.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// No real audio-amplitude data exists to visualize (this project's own low-fidelity philosophy,
// see agents.md — a decorative waveform, not real audio analysis, same stance as
// `WaveformAudioPlayer`). Each bar gets a deterministic base height *and* an animation-delay/
// duration pair, so a pure-CSS pulse animation (see style.css) reads as a lively, non-uniform
// equalizer instead of every bar pulsing in obvious lockstep.
function generateBarProfile(seed: string, count: number): { base: number; delay: number; duration: number }[] {
  const bars: { base: number; delay: number; duration: number }[] = [];
  let state = hashString(seed) || 1;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return (state % 1000) / 1000;
  };
  for (let i = 0; i < count; i++) {
    bars.push({
      base: 0.15 + next() * 0.5,
      delay: next() * -1.2,
      duration: 0.6 + next() * 0.7,
    });
  }
  return bars;
}

const DEFAULT_STATUS: Record<VoiceInputBarState, string> = {
  idle: "",
  listening: "Listening…",
  speaking: "Speaking…",
  processing: "Processing…",
};

/**
 * The voice-capture-mode UI: a waveform strip, a status line, a large glowing center mic button,
 * and flanking keyboard-toggle/camera buttons — this is `FloatAssistant`'s own voice-mode input,
 * pulled out into its own reusable, fully-controlled component (see `state`'s own doc comment for
 * why it's controlled rather than owning real capture logic itself).
 */
export function VoiceInputBar({
  state,
  onMicPress,
  onKeyboardToggle,
  onCameraPress,
  showKeyboardToggle = true,
  showCamera = true,
  accentColor = "var(--rebar-color-primary, #0066cc)",
  statusText,
  barCount = 32,
  seed = "voice-input-bar",
  bionic,
  bionicOptions,
  className,
  ...props
}: VoiceInputBarProps) {
  const active = state === "listening" || state === "speaking";
  const bars = generateBarProfile(seed, barCount);
  const status = statusText ?? DEFAULT_STATUS[state];
  const statusNode = useBionicChildren(status, bionic, bionicOptions);

  return (
    <div
      {...props}
      className={clsx("rebar-voice-input-bar", className)}
      data-rebar-component="voice-input-bar"
      data-rebar-state={state}
      style={{ ...props.style, "--voice-glow": accentColor } as React.CSSProperties}
    >
      <div className="rebar-voice-input-bar-waveform" data-rebar-part="waveform" aria-hidden="true">
        {bars.map((bar, i) => (
          <span
            key={i}
            className="rebar-voice-input-bar-bar"
            style={
              {
                "--bar-base": bar.base,
                "--bar-peak": Math.min(1, bar.base + 0.45),
                animationDelay: `${bar.delay}s`,
                animationDuration: `${bar.duration}s`,
                animationPlayState: active ? "running" : "paused",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="rebar-voice-input-bar-status" data-rebar-part="status" aria-live="polite">
        {status ? statusNode : null}
      </div>

      <div className="rebar-voice-input-bar-controls">
        {showKeyboardToggle ? (
          <button
            type="button"
            className="rebar-voice-input-bar-side-btn"
            onClick={onKeyboardToggle}
            aria-label="Switch to text input"
            data-rebar-part="keyboard-toggle"
          >
            <KeyboardIcon size={20} />
          </button>
        ) : (
          <div className="rebar-voice-input-bar-side-btn-spacer" />
        )}

        <button
          type="button"
          className={clsx(
            "rebar-voice-input-bar-mic-btn",
            active && "rebar-voice-input-bar-mic-btn-active",
            state === "processing" && "rebar-voice-input-bar-mic-btn-processing",
          )}
          onClick={onMicPress}
          aria-label={state === "listening" ? "Stop listening" : "Start voice input"}
          aria-pressed={state === "listening"}
          data-rebar-part="mic-button"
        >
          <MicIcon size={28} />
        </button>

        {showCamera ? (
          <button
            type="button"
            className="rebar-voice-input-bar-side-btn"
            onClick={onCameraPress}
            aria-label="Capture a photo"
            data-rebar-part="camera-button"
          >
            <CameraIcon size={20} />
          </button>
        ) : (
          <div className="rebar-voice-input-bar-side-btn-spacer" />
        )}
      </div>
    </div>
  );
}
