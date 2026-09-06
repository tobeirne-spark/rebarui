import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextToSpeechBar } from "../components/TextToSpeechBar";

const noop = () => {};

describe("TextToSpeechBar", () => {
  it("carries data-rebar-component and reflects state on the root", () => {
    const { container } = render(
      <TextToSpeechBar state="idle" onGenerate={noop} onPlay={noop} onPause={noop} onStop={noop} />,
    );
    const root = container.querySelector('[data-rebar-component="text-to-speech-bar"]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("data-rebar-state", "idle");
  });

  describe("idle state", () => {
    it("shows a Generate button that calls onGenerate", async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();
      render(
        <TextToSpeechBar
          state="idle"
          onGenerate={onGenerate}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      const button = screen.getByRole("button", { name: /generate/i });
      await user.click(button);
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it("hides the stop button", () => {
      render(<TextToSpeechBar state="idle" onGenerate={noop} onPlay={noop} onPause={noop} onStop={noop} />);
      expect(screen.queryByRole("button", { name: /stop/i })).not.toBeInTheDocument();
    });

    it("announces readiness in the aria-live status region", () => {
      const { container } = render(
        <TextToSpeechBar state="idle" onGenerate={noop} onPlay={noop} onPause={noop} onStop={noop} />,
      );
      const status = container.querySelector('[data-rebar-part="status"]');
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(status).toHaveTextContent(/ready to generate/i);
    });
  });

  describe("generating state", () => {
    it("shows a disabled button with a real Spin indicator, not a hand-rolled spinner", () => {
      const { container } = render(
        <TextToSpeechBar
          state="generating"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      const button = screen.getByRole("button", { name: /generating/i });
      expect(button).toBeDisabled();
      expect(container.querySelector('[data-rebar-component="spin"]')).not.toBeNull();
    });

    it("hides the stop button", () => {
      render(
        <TextToSpeechBar
          state="generating"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(screen.queryByRole("button", { name: /stop/i })).not.toBeInTheDocument();
    });

    it("announces generating in the aria-live status region", () => {
      const { container } = render(
        <TextToSpeechBar
          state="generating"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /generating audio/i,
      );
    });
  });

  describe("playing state", () => {
    it("shows a Pause button that calls onPause", async () => {
      const user = userEvent.setup();
      const onPause = vi.fn();
      render(
        <TextToSpeechBar
          state="playing"
          onGenerate={noop}
          onPlay={noop}
          onPause={onPause}
          onStop={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /pause/i }));
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it("shows a stop button that calls onStop", async () => {
      const user = userEvent.setup();
      const onStop = vi.fn();
      render(
        <TextToSpeechBar
          state="playing"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={onStop}
        />,
      );
      const stopButton = screen.getByRole("button", { name: /stop/i });
      expect(stopButton).toBeInTheDocument();
      await user.click(stopButton);
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it("announces playing in the aria-live status region", () => {
      const { container } = render(
        <TextToSpeechBar
          state="playing"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(/^playing$/i);
    });
  });

  describe("paused state", () => {
    it("shows a Play button that calls onPlay", async () => {
      const user = userEvent.setup();
      const onPlay = vi.fn();
      render(
        <TextToSpeechBar
          state="paused"
          onGenerate={noop}
          onPlay={onPlay}
          onPause={noop}
          onStop={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /play/i }));
      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it("shows the stop button", () => {
      render(
        <TextToSpeechBar
          state="paused"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    });

    it("announces paused in the aria-live status region", () => {
      const { container } = render(
        <TextToSpeechBar
          state="paused"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(/^paused$/i);
    });
  });

  describe("error state", () => {
    it("shows the real errorMessage as visible text", () => {
      render(
        <TextToSpeechBar
          state="error"
          errorMessage="Network request failed"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(screen.getByText("Network request failed")).toBeInTheDocument();
    });

    it("shows a working retry affordance that calls onGenerate again", async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn();
      render(
        <TextToSpeechBar
          state="error"
          errorMessage="Network request failed"
          onGenerate={onGenerate}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      await user.click(screen.getByRole("button", { name: /retry/i }));
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it("hides the stop button", () => {
      render(
        <TextToSpeechBar
          state="error"
          errorMessage="Network request failed"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(screen.queryByRole("button", { name: /stop/i })).not.toBeInTheDocument();
    });

    it("announces the error in the aria-live status region", () => {
      const { container } = render(
        <TextToSpeechBar
          state="error"
          errorMessage="Network request failed"
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(container.querySelector('[data-rebar-part="status"]')).toHaveTextContent(
        /error: network request failed/i,
      );
    });
  });

  describe("progress bar", () => {
    it("does not render when progress is omitted", () => {
      render(<TextToSpeechBar state="playing" onGenerate={noop} onPlay={noop} onPause={noop} onStop={noop} />);
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("renders a real Progress component when progress is provided", () => {
      render(
        <TextToSpeechBar
          state="playing"
          progress={42}
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      const progress = screen.getByRole("progressbar", { name: "Playback progress" });
      expect(progress).toHaveAttribute("aria-valuenow", "42");
      expect(progress).toHaveAttribute("data-rebar-component", "progress");
    });
  });

  describe("voice picker", () => {
    it("does not render when voices is omitted", () => {
      render(<TextToSpeechBar state="idle" onGenerate={noop} onPlay={noop} onPause={noop} onStop={noop} />);
      expect(screen.queryByRole("combobox", { name: "Voice" })).not.toBeInTheDocument();
    });

    it("does not render when voices is an empty array", () => {
      render(
        <TextToSpeechBar
          state="idle"
          voices={[]}
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      expect(screen.queryByRole("combobox", { name: "Voice" })).not.toBeInTheDocument();
    });

    it("renders and calls onVoiceChange when voices is provided", async () => {
      const user = userEvent.setup();
      const onVoiceChange = vi.fn();
      render(
        <TextToSpeechBar
          state="idle"
          voices={[
            { id: "en-us-1", label: "Ava (US)" },
            { id: "en-gb-1", label: "Oliver (UK)" },
          ]}
          onVoiceChange={onVoiceChange}
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      const trigger = screen.getByRole("combobox", { name: "Voice" });
      await user.click(trigger);
      const option = await screen.findByRole("option", { name: "Oliver (UK)" });
      await user.click(option);
      expect(onVoiceChange).toHaveBeenCalledWith("en-gb-1");
    });
  });

  describe("speed slider", () => {
    it("does not render when onSpeedChange is omitted", () => {
      render(<TextToSpeechBar state="idle" onGenerate={noop} onPlay={noop} onPause={noop} onStop={noop} />);
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    });

    it("renders and calls onSpeedChange when provided", async () => {
      const user = userEvent.setup();
      const onSpeedChange = vi.fn();
      render(
        <TextToSpeechBar
          state="idle"
          speed={1}
          onSpeedChange={onSpeedChange}
          onGenerate={noop}
          onPlay={noop}
          onPause={noop}
          onStop={noop}
        />,
      );
      const slider = screen.getByRole("slider", { name: "Playback speed" });
      expect(slider).toHaveAttribute("aria-valuenow", "1");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(onSpeedChange).toHaveBeenCalled();
    });
  });
});
