import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import clsx from "clsx";

export type EllipsisDirection = "start" | "end" | "middle";

export interface EllipsisProps {
  /** The full text content — plain text only, matching antd-mobile's own `Ellipsis`; wrap markup
   * yourself around the rendered result if needed. */
  content: string;
  /** How many lines to show before truncating. Default `1`. */
  rows?: number;
  /** Where the "…" goes once truncated. Default `"end"`. */
  direction?: EllipsisDirection;
  /** Clickable text shown after truncated content — omit (the default, `""`) for no expand
   * affordance at all, permanently truncated. */
  expandText?: ReactNode;
  /** Clickable text shown after the full content once expanded — omit for no way to re-collapse. */
  collapseText?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onContentClick?: (event: MouseEvent<HTMLSpanElement>) => void;
  className?: string;
}

/** Exported for direct testing of the truncation math — jsdom reports every element's
 * `scrollHeight` as 0, so the real measure-and-binary-search loop above can never be exercised
 * in a unit test; this pure function is the actual part worth testing without a real browser. */
export function buildTruncated(content: string, keep: number, direction: EllipsisDirection): string {
  if (keep >= content.length) return content;
  if (keep <= 0) return "…";
  if (direction === "start") return "…" + content.slice(content.length - keep);
  if (direction === "middle") {
    const head = Math.ceil(keep / 2);
    const tail = Math.floor(keep / 2);
    return content.slice(0, head) + "…" + content.slice(content.length - tail);
  }
  return content.slice(0, keep) + "…";
}

/**
 * Truncates `content` to `rows` lines with a real "…", measured against the actual rendered
 * width/font — not plain CSS `text-overflow` (which only handles a single line, end-truncated,
 * with no expand affordance) — via a binary search against a hidden, off-screen measurer clone
 * that shares the real container's width and inherits its font styles from the DOM (same
 * technique class as `NoticeBar`'s own real-overflow `ResizeObserver` check, not a guessed
 * character count). `direction="end"` is what CSS `-webkit-line-clamp` could mostly achieve
 * natively; `"start"`/`"middle"` truncation and the expand/collapse text have no native CSS
 * equivalent at all, which is the real reason this exists as a component. Ported from
 * antd-mobile's `Ellipsis` — the only component in this library with this behavior.
 */
export function Ellipsis({
  content,
  rows = 1,
  direction = "end",
  expandText = "",
  collapseText = "",
  open,
  defaultOpen = false,
  onOpenChange,
  onContentClick,
  className,
}: EllipsisProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const expanded = isControlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const containerRef = useRef<HTMLSpanElement>(null);
  const measurerRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState<string | null>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const measurer = measurerRef.current;
    if (!container || !measurer) return;

    const measure = () => {
      const width = container.clientWidth;
      if (width === 0) return;
      measurer.style.width = `${width}px`;

      const lineHeight = parseFloat(getComputedStyle(container).lineHeight);
      const maxHeight = (Number.isFinite(lineHeight) ? lineHeight : 20) * rows + 1;

      measurer.textContent = content;
      if (measurer.scrollHeight <= maxHeight) {
        setOverflows(false);
        setTruncated(null);
        return;
      }
      setOverflows(true);

      const suffix = expandText && typeof expandText === "string" ? ` ${expandText}` : "";
      let lo = 0;
      let hi = content.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        measurer.textContent = buildTruncated(content, mid, direction) + suffix;
        if (measurer.scrollHeight <= maxHeight) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }
      setTruncated(buildTruncated(content, lo, direction));
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [content, rows, direction, expandText]);

  const showFull = expanded || !overflows;

  return (
    <span
      ref={containerRef}
      className={clsx("rebar-ellipsis", className)}
      data-rebar-component="ellipsis"
      onClick={onContentClick}
    >
      <span
        ref={measurerRef}
        className="rebar-ellipsis-measurer"
        aria-hidden="true"
        style={{ position: "fixed", top: 0, left: -9999, visibility: "hidden", height: "auto", whiteSpace: "normal" }}
      />
      <span data-rebar-part="content">{showFull ? content : truncated}</span>
      {overflows && !expanded && expandText ? (
        <button
          type="button"
          className="rebar-ellipsis-action"
          data-rebar-part="expand"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
        >
          {expandText}
        </button>
      ) : null}
      {overflows && expanded && collapseText ? (
        <button
          type="button"
          className="rebar-ellipsis-action"
          data-rebar-part="collapse"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
          }}
        >
          {collapseText}
        </button>
      ) : null}
    </span>
  );
}
