import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useLongPress } from "../useLongPress";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({ onLongPress, delay }: { onLongPress: () => void; delay?: number }) {
  const handlers = useLongPress({ onLongPress, delay });
  return <div data-testid="target" {...handlers} />;
}

describe("useLongPress", () => {
  it("fires onLongPress after the delay elapses", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    fireEvent.touchStart(getByTestId("target"));
    expect(onLongPress).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire if the touch ends before the delay elapses", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    fireEvent.touchStart(getByTestId("target"));
    fireEvent.touchEnd(getByTestId("target"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("does not fire if the touch moves before the delay elapses", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    fireEvent.touchStart(getByTestId("target"));
    fireEvent.touchMove(getByTestId("target"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("does not fire if the touch is cancelled before the delay elapses", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} delay={500} />);
    fireEvent.touchStart(getByTestId("target"));
    fireEvent.touchCancel(getByTestId("target"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("defaults to a 500ms delay", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Harness onLongPress={onLongPress} />);
    fireEvent.touchStart(getByTestId("target"));
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onLongPress).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
