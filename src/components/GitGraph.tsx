import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Empty } from "./Empty";

export interface GitGraphCommit {
  /** Short hash or id — shown as-is (not re-truncated), so pass whatever length reads well. */
  id: string;
  /** Ids of this commit's parents. `0` = root commit (no connector drawn), `1` = a normal commit
   * (one straight or curved connector to its parent), `2` = a merge commit (two connectors, one
   * per parent). An id naming a commit not present in `commits` is silently skipped, the same
   * "dangling reference" convention `GanttChart`'s own `dependsOn` already uses — a caller mid-edit
   * of a commit list may reference a commit that scrolled out of the window it's rendering. */
  parentIds: string[];
  /** Which branch this commit belongs to. First-seen order (scanning `commits` in the order given)
   * assigns this branch a fixed column for the rest of the graph. */
  branch: string;
  message: string;
  author?: string;
  /** A `Date` is formatted via `toISOString()` (deterministic, locale-independent — the same
   * server/client hydration-safety concern `GanttChart`'s own `dateFormat` doc comment already
   * covers for locale-dependent formatting). A plain string is shown exactly as given, trusting
   * the caller already formatted it. */
  timestamp?: string | Date;
}

export interface GitGraphProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  /** Rendered top-to-bottom in exactly this array order — row 0 is always the top row. `order`
   * below never reorders `commits`; it only picks which end gets labeled "Newest" vs "Oldest",
   * since a straight/curved connector between two dots doesn't care which one happens to be drawn
   * above the other. */
  commits: GitGraphCommit[];
  /** Which chronological direction `commits[0]` represents. `"newest-first"` (default) matches
   * plain `git log`'s own default output order (newest commit first); `"oldest-first"` matches
   * `git log --reverse`. Only changes the two small axis labels drawn above/below the timeline. */
  order?: "newest-first" | "oldest-first";
  /** Explicit color per branch name. A branch not listed here gets one deterministically from a
   * small fixed palette, keyed off a hash of its own name — the same "same input always gets the
   * same color" trick `Sticky`'s `resolveStickyColor`/`Avatar`'s placeholder picker already use in
   * this codebase, just against a theme-token palette (see `DEFAULT_PALETTE` below) instead of raw
   * hex, matching how this project's other multi-series charts (`LineChart`, `BoxPlot`, `Treemap`,
   * ...) pick a default series color. */
  branchColors?: Record<string, string>;
  /** Rendered as a real, visible caption below the graph — see ref/HEURISTICS.md #16. */
  title?: string;
  /** Falls back to a computed "Git history: N commits across M branches" summary — the graph's own
   * `role="img"` accessible name. */
  ariaLabel?: string;
  /** Defaults to a value computed from how many distinct branches appear (enough room for every
   * branch's column plus the shared message-text column) so the graph doesn't need a caller to
   * guess a width up front. */
  width?: number;
  /** Defaults to a value computed from `commits.length * rowHeight` so the graph never needs a
   * caller to guess a height, the same auto-sizing convention `GanttChart` already uses. */
  height?: number;
  rowHeight?: number;
  className?: string;
}

interface PositionedCommit extends GitGraphCommit {
  row: number;
  x: number;
  y: number;
  color: string;
}

interface Connector {
  key: string;
  d: string;
  color: string;
  childId: string;
  parentId: string;
}

// Same palette (theme-token strings, not raw hex) this project's other multi-series charts
// (LineChart/BoxPlot/Treemap/...) default to — picked by a hash of the branch's own name here
// instead of by series index, since branches (unlike an explicit `series` array) aren't numbered
// by the caller.
const DEFAULT_PALETTE = [
  "var(--rebar-color-primary, #0066cc)",
  "var(--rebar-color-success, #2e7d32)",
  "var(--rebar-color-warning, #f57c00)",
  "var(--rebar-color-danger, #d32f2f)",
  "var(--rebar-color-text-secondary, #757575)",
  "var(--rebar-color-info, #0288d1)",
];

const DOT_RADIUS = 5;
const COLUMN_GAP = 26;
const TEXT_GAP = 16;
const TEXT_COLUMN_WIDTH = 300;
const MARGIN_LEFT = 20;
const MARGIN_TOP = 24;
const MARGIN_BOTTOM = 24;
const MARGIN_RIGHT = 12;
const MAX_MESSAGE_CHARS = 48;

// Same string hash `Sticky`/`WordCloud` already use (a pure function of char codes, not
// `Math.random()`) so the same branch name always lands on the same palette color.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function resolveBranchColor(branch: string, branchColors: Record<string, string> | undefined): string {
  return (
    branchColors?.[branch] ??
    DEFAULT_PALETTE[hashString(branch) % DEFAULT_PALETTE.length] ??
    "var(--rebar-color-primary, #0066cc)"
  );
}

function firstLine(message: string): string {
  return message.split("\n")[0] ?? message;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Deterministic, locale-independent formatting — see the `timestamp` prop doc comment above for
// why this deliberately avoids `toLocaleDateString`/`toLocaleString`.
function formatTimestamp(timestamp: string | Date | undefined): string | undefined {
  if (timestamp === undefined) return undefined;
  return typeof timestamp === "string" ? timestamp : timestamp.toISOString();
}

function buildTooltip(commit: GitGraphCommit): string {
  const parts = [commit.id, commit.branch, firstLine(commit.message)];
  if (commit.author) parts.push(commit.author);
  const ts = formatTimestamp(commit.timestamp);
  if (ts) parts.push(ts);
  return parts.join(" — ");
}

function buildAccessibleListItem(commit: GitGraphCommit): string {
  const bits = [`${commit.id}: ${commit.message}`, `branch ${commit.branch}`];
  if (commit.author) bits.push(`by ${commit.author}`);
  const ts = formatTimestamp(commit.timestamp);
  if (ts) bits.push(ts);
  return bits.join(", ");
}

/**
 * A static, read-only branch/commit graph — the classic visualization GitLens/gitk/gitgraph.js all
 * draw, built purpose-specific rather than as a composition of `NodeLinkGraph`: a git graph's
 * layout is fundamentally different from that component's three general-purpose layouts (branch
 * columns are assigned once and stay fixed for their lifetime; position along the timeline is a
 * direct, unscaled function of array order, never a computed depth/ring/grid; a commit connects to
 * its own real parent(s), not an arbitrary edge list) — the same reasoning `GanttChart`/
 * `SankeyDiagram` stay standalone despite superficial "diagram" family resemblance to
 * `NodeLinkGraph`'s siblings.
 *
 * **Timeline axis**: vertical, one row per commit, top-to-bottom in exactly the array order given
 * — chosen (over horizontal) because it's what every real git-graph tool (GitLens, gitk, the
 * gitgraph.js library this whole visualization is named after) actually draws, and because a
 * vertical row has natural room for this component's required visible per-commit text (short hash
 * + first line of message) without fighting a horizontal timeline for the same space. `order` only
 * labels which end is "Newest"/"Oldest" (see its own doc comment) — it never reorders `commits`.
 *
 * **Column assignment**: a branch is assigned the next free column index the first time it's seen
 * scanning `commits` in array order, and keeps that column for every subsequent commit on it — a
 * plain `Map<branchName, columnIndex>` built in one pass, no rebalancing.
 *
 * **Connector math** (the one genuinely non-trivial piece): a commit with parent(s) draws one path
 * per real, present parent (a dangling `parentIds` entry is silently skipped). When a commit and
 * its parent share a column (the common case — the previous commit on the same branch), the
 * connector is a plain straight `L` line. When they sit in *different* columns (a branch's first
 * commit branching off another, or either side of a merge), the connector is a cubic Bézier whose
 * control points sit directly below/above each endpoint at the shared vertical midpoint:
 * `M x1,y1 C x1,mid  x2,mid  x2,y2` where `mid = (y1+y2)/2`. Because each control point shares its
 * endpoint's own x and only the midpoint y, the curve starts and ends perfectly vertical (tangent
 * to the column it's leaving/entering) and does all its horizontal travel in the middle third of
 * the curve — the classic gitgraph.js "S-curve" look where a branch line visibly diverges from, or
 * converges into, another column instead of cutting a diagonal straight through unrelated rows. A
 * merge commit (two `parentIds`) simply draws this per parent independently — typically one
 * straight line (into its own branch's previous commit) and one curve (into the branch being
 * merged), which is exactly the classic merge-commit look with no special-cased "merge" branch in
 * the math at all.
 *
 * **Connector color**: matches the *parent's* branch color, not the child's — "whichever commit
 * it's flowing from," read as the direction real git history flows (a commit is born from its
 * parent, not the other way around). For the common straight-line case (same branch) this is the
 * same color as the child's own dot anyway; for a merge's second connector this colors the line by
 * the branch actually being merged in, matching how GitLens/gitgrack-style viewers read visually.
 *
 * **Text alignment**: every row's hash/branch/message text starts at one shared x position (just
 * right of the *rightmost* branch column, not each row's own dot), the same "one aligned text
 * column regardless of per-row indentation" convention real git-graph tools use — computing it
 * per-dot instead would zig-zag the text left/right with every branch change and be far harder to
 * read as a list.
 *
 * **Empty state**: `commits.length === 0` renders the real `Empty` component in place of the graph
 * — this project's chart family has a documented, recurring gap of skipping this (see
 * ref/COMPONENT_BACKLOG.md), so this component does it from the start rather than needing a
 * follow-up fix.
 *
 * **Accessibility**: the SVG is `role="img"` with a computed `aria-label` summary (count of commits
 * and distinct branches) — the same "one blanket label, no per-element detail" gap several existing
 * chart components are flagged for in ref/COMPONENT_BACKLOG.md. This component also renders a real
 * visually-hidden (`.rebar-visually-hidden`, not `display: none` — stays in the accessibility tree)
 * `<ul>` listing every commit's hash, full message, branch, author, and timestamp, so a screen
 * reader user gets the same information a sighted user reads off the graph, not just a headcount.
 *
 * No interactive affordance is added (no click-to-expand, no pan/zoom) — this is a static, read-only
 * diagram by design, so the touch-optimization gate (packages/core/robot.md checklist item 5) has
 * nothing to check here; a future interactive feature added to this component would need to clear
 * the real 44×44px touch-target minimum like everywhere else in this codebase.
 */
export function GitGraph({
  commits,
  order = "newest-first",
  branchColors,
  title,
  ariaLabel,
  width,
  height,
  rowHeight = 32,
  className,
  ...props
}: GitGraphProps) {
  if (commits.length === 0) {
    return (
      <figure
        className={clsx("rebar-chart", "rebar-git-graph", className)}
        data-rebar-component="git-graph"
        style={{ margin: 0 }}
        {...props}
      >
        <Empty description="No commits" />
        {title ? (
          <figcaption
            data-rebar-part="title"
            style={{
              textAlign: "center",
              fontSize: "var(--rebar-font-size-sm)",
              color: "var(--rebar-color-text-secondary, #757575)",
              marginTop: "var(--rebar-space-xs)",
            }}
          >
            {title}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const branchColumns = new Map<string, number>();
  for (const commit of commits) {
    if (!branchColumns.has(commit.branch)) branchColumns.set(commit.branch, branchColumns.size);
  }
  const columnCount = branchColumns.size;

  const textStartX = MARGIN_LEFT + Math.max(0, columnCount - 1) * COLUMN_GAP + DOT_RADIUS + TEXT_GAP;
  const resolvedWidth = width ?? textStartX + TEXT_COLUMN_WIDTH + MARGIN_RIGHT;
  const resolvedHeight = height ?? MARGIN_TOP + commits.length * rowHeight + MARGIN_BOTTOM;

  const positioned: PositionedCommit[] = commits.map((commit, i) => ({
    ...commit,
    row: i,
    x: MARGIN_LEFT + (branchColumns.get(commit.branch) ?? 0) * COLUMN_GAP,
    y: MARGIN_TOP + i * rowHeight + rowHeight / 2,
    color: resolveBranchColor(commit.branch, branchColors),
  }));
  const positionedById = new Map(positioned.map((commit) => [commit.id, commit]));

  const connectors: Connector[] = positioned.flatMap((child) =>
    child.parentIds.flatMap((parentId): Connector[] => {
      const parent = positionedById.get(parentId);
      if (!parent) return [];
      const mid = (child.y + parent.y) / 2;
      const d =
        parent.x === child.x
          ? `M ${child.x},${child.y} L ${parent.x},${parent.y}`
          : `M ${child.x},${child.y} C ${child.x},${mid} ${parent.x},${mid} ${parent.x},${parent.y}`;
      return [{ key: `${child.id}->${parentId}`, d, color: parent.color, childId: child.id, parentId }];
    }),
  );

  const topLabel = order === "oldest-first" ? "Oldest" : "Newest";
  const bottomLabel = order === "oldest-first" ? "Newest" : "Oldest";
  const defaultAriaLabel = `Git history: ${commits.length} commit${commits.length === 1 ? "" : "s"} across ${columnCount} branch${columnCount === 1 ? "" : "es"}`;

  return (
    <figure
      className={clsx("rebar-chart", "rebar-git-graph", className)}
      data-rebar-component="git-graph"
      style={{ margin: 0 }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${resolvedWidth} ${resolvedHeight}`}
        style={{ width: "100%", maxWidth: resolvedWidth, height: "auto", display: "block" }}
        role="img"
        aria-label={ariaLabel ?? defaultAriaLabel}
      >
        <text
          data-rebar-part="order-label"
          data-position="top"
          x={MARGIN_LEFT}
          y={14}
          fontSize={10}
          fill="var(--rebar-color-text-secondary, #757575)"
        >
          {topLabel}
        </text>
        <text
          data-rebar-part="order-label"
          data-position="bottom"
          x={MARGIN_LEFT}
          y={resolvedHeight - 8}
          fontSize={10}
          fill="var(--rebar-color-text-secondary, #757575)"
        >
          {bottomLabel}
        </text>
        <g data-rebar-part="connectors">
          {connectors.map((conn) => (
            <path
              key={conn.key}
              data-rebar-part="connector"
              data-from={conn.childId}
              data-to={conn.parentId}
              d={conn.d}
              fill="none"
              stroke={conn.color}
              strokeWidth={2}
            />
          ))}
        </g>
        <g data-rebar-part="commits">
          {positioned.map((commit) => {
            const label = truncate(firstLine(commit.message), MAX_MESSAGE_CHARS);
            return (
              <g
                key={commit.id}
                data-rebar-part="commit"
                data-commit-id={commit.id}
                data-branch={commit.branch}
                transform={`translate(${commit.x}, ${commit.y})`}
              >
                <circle
                  data-rebar-part="commit-dot"
                  r={DOT_RADIUS}
                  fill={commit.color}
                  stroke="var(--rebar-color-bg-primary, #ffffff)"
                  strokeWidth={1.5}
                >
                  <title>{buildTooltip(commit)}</title>
                </circle>
                <text data-rebar-part="commit-label" x={textStartX - commit.x} y={4} fontSize={11}>
                  <tspan fill="var(--rebar-color-text-secondary, #757575)" fontFamily="monospace">
                    {commit.id}
                  </tspan>
                  <tspan dx={6} fill={commit.color} fontWeight="var(--rebar-font-weight-medium, 500)">
                    {commit.branch}
                  </tspan>
                  <tspan dx={6} fill="var(--rebar-color-text-primary, #212121)">
                    {label}
                  </tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <ul className="rebar-visually-hidden" data-rebar-part="accessible-list">
        {commits.map((commit) => (
          <li key={commit.id}>{buildAccessibleListItem(commit)}</li>
        ))}
      </ul>
      {title ? (
        <figcaption
          data-rebar-part="title"
          style={{
            textAlign: "center",
            fontSize: "var(--rebar-font-size-sm)",
            color: "var(--rebar-color-text-secondary, #757575)",
            marginTop: "var(--rebar-space-xs)",
          }}
        >
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}
