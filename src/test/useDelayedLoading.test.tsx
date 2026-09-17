import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useDelayedLoading } from "../useDelayedLoading";

function Probe({ loading, delayMs, minDurationMs }: { loading: boolean; delayMs?: number; minDurationMs?: number }) {
  const visible = useDelayedLoading(loading, { delayMs, minDurationMs });
  return <div>{visible ? "visible" : "hidden"}</div>;
}

describe("useDelayedLoading", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("with delayMs, never shows visible if loading resolves before the delay elapses", () => {
    const { rerender } = render(<Probe loading delayMs={200} />);
    expect(screen.getByText("hidden")).toBeInTheDocument();
    rerender(<Probe loading={false} delayMs={200} />);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("with delayMs, shows visible once the delay elapses while still loading", () => {
    render(<Probe loading delayMs={200} />);
    expect(screen.getByText("hidden")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("with minDurationMs, stays visible for the minimum even after loading goes false", () => {
    const { rerender } = render(<Probe loading minDurationMs={300} />);
    expect(screen.getByText("visible")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(100));
    rerender(<Probe loading={false} minDurationMs={300} />);
    expect(screen.getByText("visible")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("with both unset, tracks loading with no artificial delay", () => {
    const { rerender } = render(<Probe loading />);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText("visible")).toBeInTheDocument();
    rerender(<Probe loading={false} />);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText("hidden")).toBeInTheDocument();
  });
});
