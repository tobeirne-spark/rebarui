import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceInputBar } from "../components/VoiceInputBar";

describe("VoiceInputBar", () => {
  it("carries data-rebar-component and reflects state on the root", () => {
    const { container } = render(<VoiceInputBar state="listening" />);
    const root = container.querySelector('[data-rebar-component="voice-input-bar"]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("data-rebar-state", "listening");
  });

  it("calls onMicPress when the mic button is clicked", async () => {
    const user = userEvent.setup();
    const onMicPress = vi.fn();
    render(<VoiceInputBar state="idle" onMicPress={onMicPress} />);
    await user.click(screen.getByRole("button", { name: /start voice input/i }));
    expect(onMicPress).toHaveBeenCalledTimes(1);
  });

  it("labels the mic button as stop while listening, and reflects aria-pressed", () => {
    render(<VoiceInputBar state="listening" />);
    const button = screen.getByRole("button", { name: /stop listening/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onKeyboardToggle when the keyboard button is clicked", async () => {
    const user = userEvent.setup();
    const onKeyboardToggle = vi.fn();
    render(<VoiceInputBar state="idle" onKeyboardToggle={onKeyboardToggle} />);
    await user.click(screen.getByRole("button", { name: /switch to text input/i }));
    expect(onKeyboardToggle).toHaveBeenCalledTimes(1);
  });

  it("hides the keyboard button when showKeyboardToggle is false", () => {
    render(<VoiceInputBar state="idle" showKeyboardToggle={false} />);
    expect(screen.queryByRole("button", { name: /switch to text input/i })).not.toBeInTheDocument();
  });

  it("calls onCameraPress when the camera button is clicked", async () => {
    const user = userEvent.setup();
    const onCameraPress = vi.fn();
    render(<VoiceInputBar state="idle" onCameraPress={onCameraPress} />);
    await user.click(screen.getByRole("button", { name: /capture a photo/i }));
    expect(onCameraPress).toHaveBeenCalledTimes(1);
  });

  it("hides the camera button when showCamera is false", () => {
    render(<VoiceInputBar state="idle" showCamera={false} />);
    expect(screen.queryByRole("button", { name: /capture a photo/i })).not.toBeInTheDocument();
  });

  it("shows the default status text per state", () => {
    const { container, rerender } = render(<VoiceInputBar state="idle" />);
    expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent("");

    rerender(<VoiceInputBar state="listening" />);
    expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(/listening/i);

    rerender(<VoiceInputBar state="speaking" />);
    expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(/speaking/i);

    rerender(<VoiceInputBar state="processing" />);
    expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(/processing/i);
  });

  it("lets statusText override the default per-state message", () => {
    render(<VoiceInputBar state="listening" statusText="Go ahead…" />);
    expect(screen.getByText("Go ahead…")).toBeInTheDocument();
  });

  it("the status region is a real aria-live announcement", () => {
    const { container } = render(<VoiceInputBar state="listening" />);
    expect(container.querySelector('[data-rebar-part="status"]')).toHaveAttribute("aria-live", "polite");
  });

  it("renders the requested number of waveform bars", () => {
    const { container } = render(<VoiceInputBar state="idle" barCount={16} />);
    expect(container.querySelectorAll('[data-rebar-part="waveform"] .rebar-voice-input-bar-bar')).toHaveLength(16);
  });

  it("renders the identical waveform for the same seed (deterministic, not Math.random)", () => {
    const { container: a } = render(<VoiceInputBar state="idle" seed="fixed-seed" />);
    const { container: b } = render(<VoiceInputBar state="idle" seed="fixed-seed" />);
    const heightsA = Array.from(a.querySelectorAll(".rebar-voice-input-bar-bar")).map(
      (el) => (el as HTMLElement).style.getPropertyValue("--bar-base"),
    );
    const heightsB = Array.from(b.querySelectorAll(".rebar-voice-input-bar-bar")).map(
      (el) => (el as HTMLElement).style.getPropertyValue("--bar-base"),
    );
    expect(heightsA).toEqual(heightsB);
    expect(heightsA.length).toBeGreaterThan(0);
  });
});
