import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Text } from "./Text";

export interface VideoPlayerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  src: string;
  poster?: string;
  /** Seconds the skip-back/skip-forward buttons jump by. Default 10. */
  skipSeconds?: number;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * A video transport control — play/pause/scrub/volume/fullscreen, the same shape as the existing
 * `WaveformAudioPlayer` (also Opinion), just for video: a real `<video>` element underneath,
 * driven entirely by this component's own play/pause/seek logic, with the same real,
 * keyboard-operable `role="slider"` scrub bar (ArrowLeft/ArrowRight seek by 5s, Home/End jump to
 * start/end — see ref/HEURISTICS.md #38, no click/drag-only control).
 */
export function VideoPlayer({
  src,
  poster,
  skipSeconds = 10,
  className,
  "aria-label": ariaLabel = "Video player",
  ...props
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);

  // A new src is a genuinely new clip — reset transport state rather than carrying over the
  // previous clip's position/error/playing state onto it.
  useEffect(() => {
    setError(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
  }, []);

  const handleEnded = useCallback(() => setPlaying(false), []);
  const handleError = useCallback(() => {
    setError(true);
    setPlaying(false);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      void video.play();
      setPlaying(true);
    }
  };

  const seekTo = useCallback(
    (next: number) => {
      const video = videoRef.current;
      if (!video) return;
      const bounded = Math.min(Math.max(next, 0), duration || video.duration || Infinity);
      const clamped = Number.isFinite(bounded) ? bounded : Math.max(next, 0);
      video.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration],
  );

  const skip = useCallback((delta: number) => seekTo((videoRef.current?.currentTime ?? 0) + delta), [seekTo]);

  const seekToRatio = useCallback(
    (ratio: number) => {
      if (!duration) return;
      seekTo(Math.min(Math.max(ratio, 0), 1) * duration);
    },
    [duration, seekTo],
  );

  const handleScrubClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = scrubRef.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    seekToRatio((e.clientX - rect.left) / rect.width);
  };

  const handleScrubKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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

  const applyVolume = (next: number) => {
    const video = videoRef.current;
    setVolume(next);
    if (video) video.volume = next;
    if (next > 0 && muted) {
      setMuted(false);
      if (video) video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (video) video.muted = next;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen?.();
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={clsx("rebar-video-player", className)}
      data-rebar-component="video-player"
      role="group"
      aria-label={ariaLabel}
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onClick={togglePlay}
        className="rebar-video-player-video"
        data-rebar-part="video"
      />
      {error ? (
        <Text className="rebar-video-player-error" data-rebar-part="error" role="alert">
          Couldn't load this video.
        </Text>
      ) : (
        <div className="rebar-video-player-controls" data-rebar-part="controls">
          <Button aria-label={playing ? "Pause" : "Play"} data-rebar-part="play-button" size="sm" onClick={togglePlay}>
            {playing ? "Pause" : "Play"}
          </Button>
          <Button
            aria-label="Skip back"
            data-rebar-part="skip-back"
            variant="secondary"
            size="sm"
            onClick={() => skip(-skipSeconds)}
          >
            «{skipSeconds}
          </Button>
          <Button
            aria-label="Skip forward"
            data-rebar-part="skip-forward"
            variant="secondary"
            size="sm"
            onClick={() => skip(skipSeconds)}
          >
            {skipSeconds}»
          </Button>
          <div
            ref={scrubRef}
            className="rebar-video-player-scrub"
            data-rebar-part="scrub"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            onClick={handleScrubClick}
            onKeyDown={handleScrubKeyDown}
          >
            <div className="rebar-video-player-scrub-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <Text className="rebar-video-player-time" size="xs" data-rebar-part="time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          <Button
            aria-label={muted ? "Unmute" : "Mute"}
            data-rebar-part="mute"
            variant="secondary"
            size="sm"
            onClick={toggleMute}
          >
            {muted ? "Muted" : "Vol"}
          </Button>
          <input
            type="range"
            className="rebar-video-player-volume"
            data-rebar-part="volume"
            aria-label="Volume"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => applyVolume(Number(e.target.value))}
          />
          <Button
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            data-rebar-part="fullscreen"
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
          >
            {fullscreen ? "Exit" : "Fullscreen"}
          </Button>
        </div>
      )}
    </div>
  );
}
