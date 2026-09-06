import { useRef } from "react";
import type { TouchEvent } from "react";

export interface UseLongPressOptions {
  onLongPress: () => void;
  /** How long a touch must hold before it counts as a long-press, in ms. */
  delay?: number;
}

export interface LongPressHandlers {
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
  onTouchCancel: () => void;
}

/**
 * A real touch equivalent for interactions gated behind `onDoubleClick` — a mouse-only pattern
 * that a touch user has no equivalent gesture for. See ref/HEURISTICS.md: any double-click
 * interaction needs a long-press fallback, not just a desktop affordance nobody on a phone or
 * tablet can actually trigger. Pair the returned handlers with a plain `onDoubleClick` on the same
 * element — the two are independent, not a replacement for each other, since a touch device never
 * fires a real `dblclick` and a mouse never fires `touchstart`.
 *
 * Cancels itself if the touch moves (a scroll, a drag start) before `delay` elapses, so a
 * long-press never fires mid-scroll or mid-drag — the same "moved past a threshold means this
 * wasn't a press" discipline `Kanban`'s own click-vs-drag conflict already resolves for mouse
 * drag.
 */
export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = () => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  return {
    onTouchStart: () => {
      cancel();
      timerRef.current = setTimeout(onLongPress, delay);
    },
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onTouchCancel: cancel,
  };
}
