import { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Progress } from "./Progress";

export interface UploadQueueItem {
  id: string;
  name: string;
  /** 0-100. Still meaningful for a `"paused"` item (wherever it stopped), ignored for `"error"`. */
  progress: number;
  status: "uploading" | "paused" | "done" | "error";
  errorMessage?: string;
}

// `onPause` collides with React's generic `DOMAttributes` media-event handler (present on every
// element's HTML attributes, not just media elements) — the same "differently-typed prop sharing
// a native name" trap `Card`'s own `title` hit (see robot.md checklist item 6), so it needs an
// explicit `Omit` rather than silently shadowing the native one.
export interface UploadQueueProps extends Omit<ComponentPropsWithoutRef<"div">, "onPause"> {
  /**
   * Caller owns all upload state and progress reporting — this component performs no uploads
   * itself, the same convention `FileUpload`'s own `files` prop uses. An empty array renders
   * nothing at all: an absent queue is just absent, not an empty state needing its own chrome.
   */
  items: UploadQueueItem[];
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Remove a done/error item from the visible list — the caller drops it from `items`. */
  onDismiss?: (id: string) => void;
  minimized?: boolean;
  defaultMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
}

/**
 * A persistent, app-wide upload queue — a floating panel (portal-rendered to `document.body`, the
 * same convention `Tour`/`Toast` already use for an app-wide floating element) listing every
 * in-flight upload with pause/resume/retry/dismiss controls, collapsible to a small count pill.
 *
 * This component doesn't itself persist across a real route change — that's the caller's job,
 * lifting `items` state above the router — but rendering via portal rather than assuming it's
 * nested inside page content means it never gets clipped/reflowed by whatever page content sits
 * around wherever it's mounted.
 */
export function UploadQueue({
  items,
  onPause,
  onResume,
  onRetry,
  onDismiss,
  minimized,
  defaultMinimized,
  onMinimizedChange,
  className,
  ...rest
}: UploadQueueProps) {
  const isMinimizedControlled = minimized !== undefined;
  const [internalMinimized, setInternalMinimized] = useState(defaultMinimized ?? false);
  const currentMinimized = isMinimizedControlled ? minimized : internalMinimized;
  const setMinimized = (next: boolean) => {
    if (!isMinimizedControlled) setInternalMinimized(next);
    onMinimizedChange?.(next);
  };

  // Same SSR-safety gate `Tour` uses before calling `createPortal` — `document.body` doesn't
  // exist during server render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  const doneCount = items.filter((item) => item.status === "done").length;
  const uploadingCount = items.filter((item) => item.status === "uploading").length;
  const showSummary = items.length > 1;
  const summaryText = `${doneCount} of ${items.length} uploaded`;
  const pillText = uploadingCount > 0 ? `${uploadingCount} uploading` : summaryText;

  return createPortal(
    <div
      className={clsx("rebar-upload-queue", className)}
      data-rebar-component="upload-queue"
      data-rebar-state={currentMinimized ? "minimized" : "expanded"}
      {...rest}
    >
      {currentMinimized ? (
        <button
          type="button"
          className="rebar-upload-queue-pill"
          data-rebar-part="minimize-toggle"
          aria-label={`Show upload queue: ${pillText}`}
          onClick={() => setMinimized(false)}
        >
          {pillText}
        </button>
      ) : (
        <div className="rebar-upload-queue-panel" data-rebar-part="panel">
          <div className="rebar-upload-queue-header" data-rebar-part="header">
            <span className="rebar-upload-queue-title" data-rebar-part="title">
              Uploads
            </span>
            {showSummary ? (
              <span className="rebar-upload-queue-summary" data-rebar-part="summary">
                {summaryText}
              </span>
            ) : null}
            <button
              type="button"
              className="rebar-upload-queue-minimize"
              data-rebar-part="minimize-toggle"
              aria-label="Minimize upload queue"
              onClick={() => setMinimized(true)}
            >
              −
            </button>
          </div>
          <ul className="rebar-upload-queue-list" data-rebar-part="list">
            {items.map((item) => (
              <li
                key={item.id}
                className="rebar-upload-queue-item"
                data-rebar-part="item"
                data-rebar-status={item.status}
              >
                <div className="rebar-upload-queue-item-info">
                  <span className="rebar-upload-queue-item-name" data-rebar-part="item-name">
                    {item.name}
                  </span>
                  {item.status === "error" ? (
                    <span className="rebar-upload-queue-item-error" data-rebar-part="item-error">
                      {item.errorMessage ?? "Upload failed"}
                    </span>
                  ) : null}
                </div>
                {item.status !== "error" ? (
                  <Progress
                    value={item.progress}
                    aria-label={
                      item.status === "done"
                        ? `${item.name}: upload complete`
                        : `${item.name}: ${item.progress}% uploaded`
                    }
                    className="rebar-upload-queue-progress"
                  />
                ) : null}
                <div className="rebar-upload-queue-item-actions" data-rebar-part="item-actions">
                  {item.status === "uploading" ? (
                    <button
                      type="button"
                      className="rebar-upload-queue-control"
                      data-rebar-part="pause-button"
                      aria-label={`Pause ${item.name}`}
                      onClick={() => onPause?.(item.id)}
                    >
                      ⏸
                    </button>
                  ) : null}
                  {item.status === "paused" ? (
                    <button
                      type="button"
                      className="rebar-upload-queue-control"
                      data-rebar-part="pause-button"
                      aria-label={`Resume ${item.name}`}
                      onClick={() => onResume?.(item.id)}
                    >
                      ▶
                    </button>
                  ) : null}
                  {item.status === "error" ? (
                    <button
                      type="button"
                      className="rebar-upload-queue-control"
                      data-rebar-part="retry-button"
                      aria-label={`Retry ${item.name}`}
                      onClick={() => onRetry?.(item.id)}
                    >
                      ↻
                    </button>
                  ) : null}
                  {item.status === "done" || item.status === "error" ? (
                    <button
                      type="button"
                      className="rebar-upload-queue-control"
                      data-rebar-part="dismiss-button"
                      aria-label={`Dismiss ${item.name}`}
                      onClick={() => onDismiss?.(item.id)}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>,
    document.body,
  );
}
