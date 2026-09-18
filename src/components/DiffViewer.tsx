import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface DiffViewerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  oldText: string;
  newText: string;
  /** `"split"` (default) — old/new side by side, aligned line-for-line. `"unified"` — one column,
   * each line prefixed `+`/`-`/` `. */
  mode?: "split" | "unified";
  oldLabel?: string;
  newLabel?: string;
}

interface DiffLine {
  type: "same" | "add" | "remove";
  oldLine?: string;
  newLine?: string;
}

/**
 * A real, computed line-level diff — an actual LCS (longest-common-subsequence) alignment, not a
 * naive index-by-index comparison, so an insertion/deletion in the middle of the text doesn't
 * falsely mark every line after it as changed. Static, no interactivity, the same tier as
 * `CodeBlock`. O(lines(oldText) × lines(newText)) time/space — fine for a doc/snippet-sized diff,
 * not built for whole-file-scale input.
 */
export function DiffViewer({
  oldText,
  newText,
  mode = "split",
  oldLabel = "Before",
  newLabel = "After",
  className,
  ...props
}: DiffViewerProps) {
  const diff = computeLineDiff(oldText.split("\n"), newText.split("\n"));

  return (
    <div
      className={clsx("rebar-diff-viewer", className)}
      data-rebar-component="diff-viewer"
      data-rebar-mode={mode}
      {...props}
    >
      {mode === "unified" ? (
        <div className="rebar-diff-viewer-unified" data-rebar-part="unified">
          {diff.map((line, i) => (
            <div key={i} className="rebar-diff-viewer-line" data-rebar-part="line" data-rebar-line-type={line.type}>
              <span className="rebar-diff-viewer-marker" aria-hidden="true">
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
              </span>
              <span className="rebar-diff-viewer-text">{line.type === "add" ? line.newLine : line.oldLine}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rebar-diff-viewer-split" data-rebar-part="split">
          <div className="rebar-diff-viewer-column" data-rebar-part="column-old">
            <div className="rebar-diff-viewer-column-label" data-rebar-part="column-label">
              {oldLabel}
            </div>
            {diff.map((line, i) => (
              <div
                key={i}
                className="rebar-diff-viewer-line"
                data-rebar-part="line"
                data-rebar-line-type={line.type === "add" ? "empty" : line.type}
              >
                <span className="rebar-diff-viewer-text">{line.type === "add" ? "" : line.oldLine}</span>
              </div>
            ))}
          </div>
          <div className="rebar-diff-viewer-column" data-rebar-part="column-new">
            <div className="rebar-diff-viewer-column-label" data-rebar-part="column-label">
              {newLabel}
            </div>
            {diff.map((line, i) => (
              <div
                key={i}
                className="rebar-diff-viewer-line"
                data-rebar-part="line"
                data-rebar-line-type={line.type === "remove" ? "empty" : line.type}
              >
                <span className="rebar-diff-viewer-text">{line.type === "remove" ? "" : line.newLine}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function computeLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i]![j] = oldLines[i] === newLines[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: "same", oldLine: oldLines[i], newLine: newLines[j] });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      result.push({ type: "remove", oldLine: oldLines[i] });
      i++;
    } else {
      result.push({ type: "add", newLine: newLines[j] });
      j++;
    }
  }
  while (i < m) {
    result.push({ type: "remove", oldLine: oldLines[i] });
    i++;
  }
  while (j < n) {
    result.push({ type: "add", newLine: newLines[j] });
    j++;
  }
  return result;
}
