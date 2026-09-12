import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Text } from "./Text";

export interface WaveformAudioPlayerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  src: string;
  /** How many bars to render across the waveform. Default 48. */
  barCount?: number;
  /** Seconds the skip-back/skip-forward buttons jump by. Default 15. */
  skipSeconds?: number;
}

// Same seeded-hash technique Sticky's rotation/color pick and Avatar's placeholder selection
// already use (see stickyColor.ts / avatarPlaceholder.ts) — never Math.random, so the same `src`
// always renders the same-looking waveform rather than reshuffling on every mount/reload.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// No real amplitude data exists to visualize (this project's own low-fidelity philosophy, see
// robot.md — a decorative waveform, not a real audio analysis). A cheap linear congruential
// generator advanced from the seed hash gives a deterministic, good-enough-looking spread of bar
// heights (15%-100%) without pulling in a real FFT/waveform-extraction dependency.
function generateBarHeights(seed: string, count: number): number[] {
  const heights: number[] = [];
  let state = hashString(seed) || 1;
  for (let i = 0; i < count; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    heights.push(0.15 + ((state % 1000) / 1000) * 0.85);
  }
  return heights;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * An audio transport control with a bar-based waveform display — a real `<audio>` element
 * underneath (visually hidden), driven entirely by this component's own play/pause/seek logic.
 * The waveform is purely decorative (no real amplitude analysis, matching this project's
 * low-fidelity philosophy) but deterministic: the same `src` always renders the same bar pattern,
 * via a seeded hash rather than `Math.random` (see `generateBarHeights` above).
 *
 * The bars double as a real scrub bar — click/tap seeks to that position, and since a
 * click/drag-only scrub control would violate this project's own non-drag-fallback rule (see
 * ref/HEURISTICS.md #38), the waveform region is also a real `role="slider"`, keyboard-operable
 * (ArrowLeft/ArrowRight seek by 5s, Home/End jump to start/end).
 */
export function WaveformAudioPlayer({
  src,
  barCount = 48,
  skipSeconds = 15,
  className,
  "aria-label": ariaLabel = "Audio player",
  ...props
}: WaveformAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const barHeights = useMemo(() => generateBarHeights(src, barCount), [src, barCount]);

  // A new src is a genuinely new track — reset transport state rather than carrying over the
  // previous track's position/error/playing state onto it.
  useEffect(() => {
    setError(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  }, []);

  const handleEnded = useCallback(() => setPlaying(false), []);

  const handleError = useCallback(() => {
    setError(true);
    setPlaying(false);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  };

  const seekTo = useCallback(
    (next: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const bounded = Math.min(Math.max(next, 0), duration || audio.duration || Infinity);
      const clamped = Number.isFinite(bounded) ? bounded : Math.max(next, 0);
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration],
  );

  const skip = useCallback(
    (delta: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(audio.currentTime + delta);
    },
    [seekTo],
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      if (!duration) return;
      seekTo(Math.min(Math.max(ratio, 0), 1) * duration);
    },
    [duration, seekTo],
  );

  const handleWaveformClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = waveformRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    seekToRatio((e.clientX - rect.left) / rect.width);
  };

  const handleWaveformKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      skip(-5);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      skip(5);
    } else if (e.key === "Home") {
      e.preventDefault();
      seekToRatio(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seekToRatio(1);
    }
  };

  const playedCount = duration > 0 ? Math.round((currentTime / duration) * barCount) : 0;

  return (
    <div
      className={clsx("rebar-waveform-audio-player", className)}
      data-rebar-component="waveform-audio-player"
      role="group"
      aria-label={ariaLabel}
      {...props}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        style={{ display: "none" }}
        data-rebar-part="audio"
      />
      {error ? (
        <Text className="rebar-waveform-audio-player-error" data-rebar-part="error" role="alert">
          Couldn't load this audio.
        </Text>
      ) : (
        <div className="rebar-waveform-audio-player-controls" data-rebar-part="controls">
          <Button
            aria-label="Skip back"
            data-rebar-part="skip-back"
            variant="secondary"
            onClick={() => skip(-skipSeconds)}
          >
            «{skipSeconds}
          </Button>
          <Button aria-label={playing ? "Pause" : "Play"} data-rebar-part="play-button" onClick={togglePlay}>
            {playing ? "Pause" : "Play"}
          </Button>
          <Button
            aria-label="Skip forward"
            data-rebar-part="skip-forward"
            variant="secondary"
            onClick={() => skip(skipSeconds)}
          >
            {skipSeconds}»
          </Button>
          <div
            ref={waveformRef}
            className="rebar-waveform-audio-player-waveform"
            data-rebar-part="waveform"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            onClick={handleWaveformClick}
            onKeyDown={handleWaveformKeyDown}
          >
            {barHeights.map((height, i) => (
              <span
                key={i}
                className="rebar-waveform-audio-player-bar"
                data-rebar-part="bar"
                data-played={i < playedCount ? "true" : undefined}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            ))}
          </div>
          <Text className="rebar-waveform-audio-player-time" size="xs" data-rebar-part="time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      )}
    </div>
  );
}
