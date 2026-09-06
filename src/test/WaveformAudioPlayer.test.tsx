import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveformAudioPlayer } from "../components/WaveformAudioPlayer";

afterEach(cleanup);

// jsdom implements `<audio>`'s `play`/`pause` as real functions but with no actual media engine
// behind them — `play()` even logs a jsdom "not implemented" warning unless stubbed. Mocked here
// (not in setup.ts) since this is the only test file in the suite that drives real playback.
let playMock: ReturnType<typeof vi.fn>;
let pauseMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  playMock = vi.fn().mockResolvedValue(undefined);
  pauseMock = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(playMock);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pauseMock);
});

// jsdom's `duration` is a getter-only stub (always NaN) — override it per test element so
// loadedmetadata-driven state (and therefore seek bounds/scrub position) has a real value to work
// with, the same way a real browser would report it once metadata actually loads.
function setDuration(audio: HTMLAudioElement, seconds: number) {
  Object.defineProperty(audio, "duration", { configurable: true, value: seconds });
}

function mockWaveformRect(el: Element, width: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: width,
    bottom: 40,
    width,
    height: 40,
    x: 0,
    y: 0,
    toJSON() {},
  });
}

describe("WaveformAudioPlayer", () => {
  it("carries data-rebar-component and role=group with an aria-label on the root", () => {
    render(<WaveformAudioPlayer src="voice-1.mp3" />);
    const root = document.querySelector('[data-rebar-component="waveform-audio-player"]')!;
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("role", "group");
    expect(root).toHaveAttribute("aria-label", "Audio player");
  });

  it("renders barCount bars, marked with data-rebar-part=bar", () => {
    render(<WaveformAudioPlayer src="voice-1.mp3" barCount={12} />);
    expect(document.querySelectorAll('[data-rebar-part="bar"]')).toHaveLength(12);
  });

  it("generates the same bar heights for the same src (deterministic seed), different for a different src", () => {
    const { container: a } = render(<WaveformAudioPlayer src="same-src.mp3" barCount={20} />);
    const heightsA = Array.from(a.querySelectorAll('[data-rebar-part="bar"]')).map(
      (el) => (el as HTMLElement).style.height,
    );
    cleanup();
    const { container: b } = render(<WaveformAudioPlayer src="same-src.mp3" barCount={20} />);
    const heightsB = Array.from(b.querySelectorAll('[data-rebar-part="bar"]')).map(
      (el) => (el as HTMLElement).style.height,
    );
    expect(heightsA).toEqual(heightsB);

    cleanup();
    const { container: c } = render(<WaveformAudioPlayer src="different-src.mp3" barCount={20} />);
    const heightsC = Array.from(c.querySelectorAll('[data-rebar-part="bar"]')).map(
      (el) => (el as HTMLElement).style.height,
    );
    expect(heightsC).not.toEqual(heightsA);
  });

  it("play/pause button toggles the underlying audio element's play state", async () => {
    const user = userEvent.setup();
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" />);
    const audio = container.querySelector("audio")!;

    const playButton = screen.getByRole("button", { name: "Play" });
    await user.click(playButton);
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(pauseMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    // Sanity: same underlying element the whole time, not remounted.
    expect(container.querySelector("audio")).toBe(audio);
  });

  it("skip buttons adjust currentTime by skipSeconds", async () => {
    const user = userEvent.setup();
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" skipSeconds={15} />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    audio.currentTime = 30;

    await user.click(screen.getByRole("button", { name: "Skip forward" }));
    expect(audio.currentTime).toBe(45);

    await user.click(screen.getByRole("button", { name: "Skip back" }));
    expect(audio.currentTime).toBe(30);
  });

  it("skip back never goes below 0", async () => {
    const user = userEvent.setup();
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" skipSeconds={15} />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    audio.currentTime = 5;

    await user.click(screen.getByRole("button", { name: "Skip back" }));
    expect(audio.currentTime).toBe(0);
  });

  it("clicking a point on the waveform seeks to the corresponding time", () => {
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    setDuration(audio, 200);
    fireEvent.loadedMetadata(audio);

    const waveform = screen.getByRole("slider", { name: "Seek" });
    mockWaveformRect(waveform, 400);

    fireEvent.click(waveform, { clientX: 200 });
    expect(audio.currentTime).toBe(100);
    expect(screen.getByText("1:40 / 3:20")).toBeInTheDocument();
  });

  it("shows a visible error message when the audio fails to load", () => {
    const { container } = render(<WaveformAudioPlayer src="broken.mp3" />);
    const audio = container.querySelector("audio")!;

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.error(audio);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("supports ArrowLeft/ArrowRight keyboard seeking on the waveform region", () => {
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    setDuration(audio, 200);
    fireEvent.loadedMetadata(audio);
    audio.currentTime = 50;

    const waveform = screen.getByRole("slider", { name: "Seek" });
    waveform.focus();

    fireEvent.keyDown(waveform, { key: "ArrowRight" });
    expect(audio.currentTime).toBe(55);

    fireEvent.keyDown(waveform, { key: "ArrowLeft" });
    fireEvent.keyDown(waveform, { key: "ArrowLeft" });
    expect(audio.currentTime).toBe(45);
  });

  it("supports Home/End keyboard seeking to the start/end of the track", () => {
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    setDuration(audio, 200);
    fireEvent.loadedMetadata(audio);
    audio.currentTime = 50;

    const waveform = screen.getByRole("slider", { name: "Seek" });
    waveform.focus();

    fireEvent.keyDown(waveform, { key: "End" });
    expect(audio.currentTime).toBe(200);

    fireEvent.keyDown(waveform, { key: "Home" });
    expect(audio.currentTime).toBe(0);
  });

  it("marks bars to the left of currentTime as played, and none past it", () => {
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" barCount={10} />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    setDuration(audio, 100);
    fireEvent.loadedMetadata(audio);
    audio.currentTime = 50;
    fireEvent.timeUpdate(audio);

    const bars = document.querySelectorAll('[data-rebar-part="bar"]');
    const playedCount = Array.from(bars).filter((b) => b.hasAttribute("data-played")).length;
    expect(playedCount).toBe(5);
  });

  it("shows current time / total duration as visible text", () => {
    const { container } = render(<WaveformAudioPlayer src="voice-1.mp3" />);
    const audio = container.querySelector("audio")! as HTMLAudioElement;
    setDuration(audio, 65);
    fireEvent.loadedMetadata(audio);

    expect(screen.getByText("0:00 / 1:05")).toBeInTheDocument();
  });

  it("resets transport state when src changes", () => {
    const { container, rerender } = render(<WaveformAudioPlayer src="voice-1.mp3" />);
    let audio = container.querySelector("audio")! as HTMLAudioElement;
    setDuration(audio, 100);
    fireEvent.loadedMetadata(audio);
    audio.currentTime = 50;
    fireEvent.timeUpdate(audio);
    expect(screen.getByText("0:50 / 1:40")).toBeInTheDocument();

    rerender(<WaveformAudioPlayer src="voice-2.mp3" />);
    expect(screen.getByText("0:00 / 0:00")).toBeInTheDocument();
  });
});
