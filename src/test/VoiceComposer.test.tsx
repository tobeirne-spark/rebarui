import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceComposer } from "../components/VoiceComposer";

const noop = () => {};

describe("VoiceComposer", () => {
  it("carries data-rebar-component and reflects state on the root", () => {
    const { container } = render(
      <VoiceComposer
        state="idle"
        onStartRecording={noop}
        onStopRecording={noop}
        onSend={noop}
        onCancel={noop}
      />,
    );
    const root = container.querySelector('[data-rebar-component="voice-composer"]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("data-rebar-state", "idle");
  });

  describe("idle state", () => {
    it("shows a Record button that calls onStartRecording", async () => {
      const user = userEvent.setup();
      const onStartRecording = vi.fn();
      render(
        <VoiceComposer
          state="idle"
          onStartRecording={onStartRecording}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /record/i }));
      expect(onStartRecording).toHaveBeenCalledTimes(1);
    });

    it("hides the cancel button", () => {
      render(
        <VoiceComposer
          state="idle"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });

    it("hides the draft textarea", () => {
      render(
        <VoiceComposer
          state="idle"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("announces readiness in the aria-live status region", () => {
      const { container } = render(
        <VoiceComposer
          state="idle"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      const status = container.querySelector('[data-rebar-part="status"]');
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(status).toHaveTextContent(/ready to record/i);
    });
  });

  describe("recording state", () => {
    it("shows a Stop button that calls onStopRecording", async () => {
      const user = userEvent.setup();
      const onStopRecording = vi.fn();
      render(
        <VoiceComposer
          state="recording"
          onStartRecording={noop}
          onStopRecording={onStopRecording}
          onSend={noop}
          onCancel={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /stop/i }));
      expect(onStopRecording).toHaveBeenCalledTimes(1);
    });

    it("formats elapsedSeconds as a live mm:ss readout", () => {
      const { container, rerender } = render(
        <VoiceComposer
          state="recording"
          elapsedSeconds={5}
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="elapsed-time"]')).toHaveTextContent(
        "00:05",
      );

      rerender(
        <VoiceComposer
          state="recording"
          elapsedSeconds={125}
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="elapsed-time"]')).toHaveTextContent(
        "02:05",
      );
    });

    it("defaults elapsedSeconds to 00:00 when omitted", () => {
      const { container } = render(
        <VoiceComposer
          state="recording"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="elapsed-time"]')).toHaveTextContent(
        "00:00",
      );
    });

    it("shows a real pulsing recording indicator", () => {
      const { container } = render(
        <VoiceComposer
          state="recording"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="recording-indicator"]')).toBeInTheDocument();
    });

    it("shows an editable draft textarea that calls onDraftTextChange, with an in-progress caption", async () => {
      const user = userEvent.setup();
      const onDraftTextChange = vi.fn();
      render(
        <VoiceComposer
          state="recording"
          draftText="hello wor"
          onDraftTextChange={onDraftTextChange}
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(screen.getByText(/transcribing as you speak/i)).toBeInTheDocument();
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("hello wor");
      await user.type(textarea, "l");
      expect(onDraftTextChange).toHaveBeenCalled();
    });

    it("shows the cancel button and calls onCancel", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <VoiceComposer
          state="recording"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("announces recording in the aria-live status region", () => {
      const { container } = render(
        <VoiceComposer
          state="recording"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /^recording$/i,
      );
    });
  });

  describe("transcribing state", () => {
    it("shows a disabled main button with a real Spin indicator, not a hand-rolled spinner", () => {
      const { container } = render(
        <VoiceComposer
          state="transcribing"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      const button = screen.getByRole("button", { name: /transcribing/i });
      expect(button).toBeDisabled();
      expect(container.querySelector('[data-rebar-component="spin"]')).not.toBeNull();
    });

    it("hides the draft textarea", () => {
      render(
        <VoiceComposer
          state="transcribing"
          draftText="partial"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("still shows the cancel button and calls onCancel", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <VoiceComposer
          state="transcribing"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("announces transcribing in the aria-live status region", () => {
      const { container } = render(
        <VoiceComposer
          state="transcribing"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /transcribing/i,
      );
    });
  });

  describe("ready state", () => {
    it("shows a Send button that calls onSend", async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      render(
        <VoiceComposer
          state="ready"
          draftText="Final draft"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={onSend}
          onCancel={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /send/i }));
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it("shows a fully-editable draft textarea (no in-progress caption) that calls onDraftTextChange", async () => {
      const user = userEvent.setup();
      const onDraftTextChange = vi.fn();
      render(
        <VoiceComposer
          state="ready"
          draftText="Final draft"
          onDraftTextChange={onDraftTextChange}
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(screen.queryByText(/transcribing as you speak/i)).not.toBeInTheDocument();
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Final draft");
      await user.type(textarea, "!");
      expect(onDraftTextChange).toHaveBeenCalled();
    });

    it("shows the cancel button and calls onCancel", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <VoiceComposer
          state="ready"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("announces readiness to send in the aria-live status region", () => {
      const { container } = render(
        <VoiceComposer
          state="ready"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /ready to send/i,
      );
    });
  });

  describe("error state", () => {
    it("shows the real errorMessage as visible text", () => {
      render(
        <VoiceComposer
          state="error"
          errorMessage="Microphone permission denied"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(screen.getByText("Microphone permission denied")).toBeInTheDocument();
    });

    it("shows a working retry affordance that calls onStartRecording again", async () => {
      const user = userEvent.setup();
      const onStartRecording = vi.fn();
      render(
        <VoiceComposer
          state="error"
          errorMessage="Microphone permission denied"
          onStartRecording={onStartRecording}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /retry/i }));
      expect(onStartRecording).toHaveBeenCalledTimes(1);
    });

    it("still shows the cancel button and calls onCancel", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <VoiceComposer
          state="error"
          errorMessage="Microphone permission denied"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("announces the error in the aria-live status region", () => {
      const { container } = render(
        <VoiceComposer
          state="error"
          errorMessage="Microphone permission denied"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /error: microphone permission denied/i,
      );
    });

    it("falls back to a generic error message in the status region when errorMessage is omitted", () => {
      const { container } = render(
        <VoiceComposer
          state="error"
          onStartRecording={noop}
          onStopRecording={noop}
          onSend={noop}
          onCancel={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /something went wrong/i,
      );
    });
  });
});
