import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Countdown } from "../components/Countdown";

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("carries data-rebar-component on the root", () => {
    render(<Countdown target="2026-01-01T00:01:00.000Z" />);
    expect(document.querySelector('[data-rebar-component="countdown"]')).not.toBeNull();
  });

  it("renders the initial remaining time in the default format", () => {
    render(<Countdown target="2026-01-01T00:01:05.000Z" />);
    expect(screen.getByText("01m 05s")).toBeInTheDocument();
  });

  it("includes hours once over an hour remains", () => {
    render(<Countdown target="2026-01-01T02:00:00.000Z" />);
    expect(screen.getByText("02h 00m 00s")).toBeInTheDocument();
  });

  it("includes days once over a day remains", () => {
    render(<Countdown target="2026-01-03T00:00:00.000Z" />);
    expect(screen.getByText("2d 00h 00m 00s")).toBeInTheDocument();
  });

  it("ticks down as real time (fake-clock) advances", () => {
    render(<Countdown target="2026-01-01T00:00:10.000Z" />);
    expect(screen.getByText("00m 10s")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("00m 07s")).toBeInTheDocument();
  });

  it("clamps at zero and fires onComplete exactly once", () => {
    const onComplete = vi.fn();
    render(<Countdown target="2026-01-01T00:00:02.000Z" onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("00m 00s")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("marks data-rebar-complete once finished", () => {
    render(<Countdown target="2026-01-01T00:00:01.000Z" />);
    act(() => vi.advanceTimersByTime(2000));
    expect(document.querySelector('[data-rebar-component="countdown"]')).toHaveAttribute(
      "data-rebar-complete",
      "true",
    );
  });

  it("accepts a custom format function", () => {
    render(<Countdown target="2026-01-01T00:00:30.000Z" format={(ms) => `${Math.ceil(ms / 1000)} seconds left`} />);
    expect(screen.getByText("30 seconds left")).toBeInTheDocument();
  });
});
