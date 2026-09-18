import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoPlayer } from "../components/VideoPlayer";

afterEach(cleanup);

// Same jsdom-limitation workarounds WaveformAudioPlayer.test.tsx already established: real
// play/pause functions with no media engine behind them, and a getter-only `duration` stub.
let playMock: ReturnType<typeof vi.fn>;
let pauseMock: ReturnType<typeof vi.fn>;
let requestFullscreenMock: ReturnType<typeof vi.fn>;
let exitFullscreenMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  playMock = vi.fn().mockResolvedValue(undefined);
  pauseMock = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(playMock);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pauseMock);

  // jsdom implements neither side of the Fullscreen API by default.
  requestFullscreenMock = vi.fn().mockResolvedValue(undefined);
  exitFullscreenMock = vi.fn().mockResolvedValue(undefined);
  HTMLElement.prototype.requestFullscreen = requestFullscreenMock;
  Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreenMock });
});

function setDuration(video: HTMLVideoElement, seconds: number) {
  Object.defineProperty(video, "duration", { configurable: true, value: seconds });
}

function mockScrubRect(el: Element, width: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: width,
    bottom: 8,
    width,
    height: 8,
    x: 0,
    y: 0,
    toJSON() {},
  });
}

describe("VideoPlayer", () => {
  it("carries data-rebar-component and role=group with an aria-label on the root", () => {
    render(<VideoPlayer src="clip.mp4" />);
    const root = document.querySelector('[data-rebar-component="video-player"]')!;
    expect(root).toHaveAttribute("role", "group");
    expect(root).toHaveAttribute("aria-label", "Video player");
  });

  it("renders a real <video> with the given src and poster", () => {
    const { container } = render(<VideoPlayer src="clip.mp4" poster="poster.jpg" />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("src", "clip.mp4");
    expect(video).toHaveAttribute("poster", "poster.jpg");
  });

  it("play/pause button toggles the underlying video element's play state", async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    const video = container.querySelector("video")!;

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(pauseMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector("video")).toBe(video);
  });

  it("clicking the video itself also toggles play/pause", async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    await user.click(container.querySelector("video")!);
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it("skip buttons adjust currentTime by skipSeconds", async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoPlayer src="clip.mp4" skipSeconds={10} />);
    const video = container.querySelector("video")! as HTMLVideoElement;
    video.currentTime = 30;

    await user.click(screen.getByRole("button", { name: "Skip forward" }));
    expect(video.currentTime).toBe(40);

    await user.click(screen.getByRole("button", { name: "Skip back" }));
    expect(video.currentTime).toBe(30);
  });

  it("clicking a point on the scrub bar seeks to the corresponding time", () => {
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    const video = container.querySelector("video")! as HTMLVideoElement;
    setDuration(video, 200);
    fireEvent.loadedMetadata(video);

    const scrub = screen.getByRole("slider", { name: "Seek" });
    mockScrubRect(scrub, 400);

    fireEvent.click(scrub, { clientX: 200 });
    expect(video.currentTime).toBe(100);
    expect(screen.getByText("1:40 / 3:20")).toBeInTheDocument();
  });

  it("supports ArrowLeft/ArrowRight and Home/End keyboard seeking on the scrub bar", () => {
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    const video = container.querySelector("video")! as HTMLVideoElement;
    setDuration(video, 200);
    fireEvent.loadedMetadata(video);
    video.currentTime = 50;

    const scrub = screen.getByRole("slider", { name: "Seek" });
    scrub.focus();

    fireEvent.keyDown(scrub, { key: "ArrowRight" });
    expect(video.currentTime).toBe(55);
    fireEvent.keyDown(scrub, { key: "ArrowLeft" });
    expect(video.currentTime).toBe(50);

    fireEvent.keyDown(scrub, { key: "End" });
    expect(video.currentTime).toBe(200);
    fireEvent.keyDown(scrub, { key: "Home" });
    expect(video.currentTime).toBe(0);
  });

  it("mute button toggles the underlying video's muted state", async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    const video = container.querySelector("video")! as HTMLVideoElement;

    await user.click(screen.getByRole("button", { name: "Mute" }));
    expect(video.muted).toBe(true);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Unmute" }));
    expect(video.muted).toBe(false);
  });

  it("the volume slider sets the underlying video's volume and unmutes on a positive value", () => {
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    const video = container.querySelector("video")! as HTMLVideoElement;

    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(video.muted).toBe(true);

    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "0.4" } });
    expect(video.volume).toBeCloseTo(0.4);
    expect(video.muted).toBe(false);
  });

  it("fullscreen button requests fullscreen on the player, and exits when already fullscreen", async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoPlayer src="clip.mp4" />);
    const root = container.querySelector('[data-rebar-component="video-player"]')!;

    await user.click(screen.getByRole("button", { name: "Fullscreen" }));
    expect(requestFullscreenMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: root });
    fireEvent(document, new Event("fullscreenchange"));
    expect(screen.getByRole("button", { name: "Exit fullscreen" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exit fullscreen" }));
    expect(exitFullscreenMock).toHaveBeenCalledTimes(1);
  });

  it("shows a visible error message when the video fails to load", () => {
    const { container } = render(<VideoPlayer src="broken.mp4" />);
    const video = container.querySelector("video")!;

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.error(video);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("resets transport state when src changes", () => {
    const { container, rerender } = render(<VideoPlayer src="clip-1.mp4" />);
    const video = container.querySelector("video")! as HTMLVideoElement;
    video.currentTime = 50;

    rerender(<VideoPlayer src="clip-2.mp4" />);
    expect(screen.getByText("0:00 / 0:00")).toBeInTheDocument();
  });
});
