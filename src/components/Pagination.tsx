import { useState } from "react";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export interface PaginationProps {
  /** 1-indexed current page. Omit for uncontrolled use via `defaultCurrent`. */
  current?: number;
  /** Initial page when uncontrolled. Ignored once `current` is passed. Defaults to 1. */
  defaultCurrent?: number;
  total: number;
  onChange?: (page: number) => void;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

/** Which page numbers to show: always the first, the last, current ± 1, and an ellipsis marker
 * (`null`) wherever a gap opens up — never a wall of every page number for a large total. */
function pageRange(current: number, total: number): (number | null)[] {
  const pages = new Set<number>([1, total, current]);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) result.push(null);
    result.push(sorted[i]!);
  }
  return result;
}

/**
 * Page-number navigation — a real `<nav aria-label>` landmark, `aria-current="page"` on the
 * active page, and a bounded set of visible page numbers (first, last, current ± 1, ellipsis for
 * the rest) rather than a button per page once the total gets large.
 */
export function Pagination({
  current,
  defaultCurrent = 1,
  total,
  onChange,
  "aria-label": ariaLabel = "Pagination",
  disabled,
  className,
}: PaginationProps) {
  const isControlled = current !== undefined;
  const [internalCurrent, setInternalCurrent] = useState(defaultCurrent);
  const currentPage = isControlled ? current : internalCurrent;

  const setPage = (next: number) => {
    if (!isControlled) setInternalCurrent(next);
    onChange?.(next);
  };

  const pages = pageRange(currentPage, total);

  return (
    <nav
      className={clsx("rebar-pagination", className)}
      data-rebar-component="pagination"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="rebar-pagination-item"
        data-rebar-part="prev"
        aria-label="Previous page"
        disabled={disabled || currentPage <= 1}
        onClick={() => setPage(currentPage - 1)}
      >
        <ChevronLeftIcon />
      </button>
      {pages.map((page, i) =>
        page === null ? (
          <span key={`ellipsis-${i}`} className="rebar-pagination-ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            className="rebar-pagination-item"
            data-rebar-part="page"
            data-rebar-active={page === currentPage || undefined}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
            disabled={disabled}
            onClick={() => setPage(page)}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        className="rebar-pagination-item"
        data-rebar-part="next"
        aria-label="Next page"
        disabled={disabled || currentPage >= total}
        onClick={() => setPage(currentPage + 1)}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
