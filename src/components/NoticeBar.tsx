import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";
import { CloseIcon } from "./icons";

export type NoticeBarTone = "default" | "info" | "success" | "warning" | "error";

export interface NoticeBarProps {
  tone?: NoticeBarTone;
  content: ReactNode;
  /** A leading icon — shown only when passed; there's no auto default per `tone` (matches this
   * project's own `Alert`, which stayed icon-free after an earlier auto-icon feature was tried
   * and reverted). */
  icon?: ReactNode;
  /** Trailing custom content, shown to the left of the close button (if any). */
  action?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  /** Wraps onto multiple lines instead of a single-line auto-scrolling marquee. Default `false`. */
  wrap?: boolean;
  className?: string;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/**
 * A persistent, full-width announcement strip — distinct from `Alert` (a boxed message inline in
 * content) and `Toast` (an ephemeral overlay): a `NoticeBar` sits pinned at the top of a view and
 * stays until dismissed or the underlying condition clears. Single-line content that doesn't fit
 * auto-scrolls as a marquee (measured directly against the real rendered width, not guessed from
 * character count) rather than clipping — set `wrap` for static multi-line content instead, where
 * a scrolling marquee would be the wrong read.
 */
export function NoticeBar({
  tone = "default",
  content,
  icon,
  action,
  closable = false,
  onClose,
  onClick,
  wrap = false,
  className,
  bionic,
  bionicOptions,
}: NoticeBarProps) {
  const contentEl = useBionicChildren(content, bionic, bionicOptions);
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (wrap) {
      setScrolling(false);
      return;
    }
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const measure = () => setScrolling(text.scrollWidth > container.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [wrap, content]);

  return (
    <div
      className={clsx("rebar-notice-bar", wrap && "rebar-notice-bar-wrap", className)}
      data-rebar-component="notice-bar"
      data-rebar-tone={tone}
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      onClick={onClick}
    >
      {icon ? (
        <span className="rebar-notice-bar-icon" data-rebar-part="icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span
        ref={containerRef}
        className="rebar-notice-bar-content"
        data-rebar-part="content"
        style={wrap ? undefined : { overflow: "hidden", whiteSpace: "nowrap" }}
      >
        <span
          ref={textRef}
          className={clsx("rebar-notice-bar-text", scrolling && "rebar-notice-bar-text-scrolling")}
          data-rebar-part="text"
        >
          {contentEl}
        </span>
      </span>
      {action ? (
        <span className="rebar-notice-bar-action" data-rebar-part="action">
          {action}
        </span>
      ) : null}
      {closable ? (
        <button
          type="button"
          className="rebar-notice-bar-close"
          data-rebar-part="close"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}
