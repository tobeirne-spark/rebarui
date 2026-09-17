/**
 * Tier per block type (see ref/TIERS.md). `satisfies Record<Construct["type"], ConstructTier>` means a
 * 40th block added to `packages/placement/src/schema.ts` without a matching entry here fails
 * `tsc --noEmit` immediately.
 *
 * The "opinion" values below aren't picked independently of `@rebar-ui/placement`'s own
 * `OpinionConstructType` (the mechanical, schema-derived source of truth built in
 * `packages/placement/src/opinions.ts`) — the type-level assertions at the bottom of this file
 * fail `tsc --noEmit` if this file's "opinion" entries ever disagree with it, so this file can't
 * silently drift from the real live-binding-capable block list. Deliberately a compile-time check
 * against the *type*, not a runtime check against the value (`OPINION_CONSTRUCT_TYPES`/
 * `isOpinionConstructType`, also exported by that package) — a real Turbopack interop bug misresolves
 * that package's named value exports inside `apps/docs`'s server build (confirmed: plain Node
 * resolves them fine; only Next's page-data-collection step doesn't), so this file imports only
 * types from `@rebar-ui/placement`, which are erased before Turbopack ever sees them.
 */
import type { Construct, OpinionConstructType } from "@rebar-ui/placement";
import type { ConstructTier } from "./tier.types";

export const BLOCK_TIER = {
  header: "synthetic",
  "nav-bar": "order",
  "site-header": "order",
  "nav-index": "order",
  "page-index": "order",
  "side-panel": "order",
  banner: "synthetic",
  checklist: "synthetic",
  "goal-tracker": "opinion",
  "ai-chat": "opinion",
  callout: "synthetic",
  "spin-card": "synthetic",
  "error-block": "synthetic",
  footer: "synthetic",
  "feature-grid": "synthetic",
  "pillar-grid": "synthetic",
  hero: "synthetic",
  "section-header": "synthetic",
  "card-grid": "synthetic",
  "persona-card": "synthetic",
  table: "opinion",
  "data-list": "synthetic",
  "filter-bar": "synthetic",
  form: "opinion",
  tabs: "order",
  modal: "order",
  wizard: "opinion",
  "card-kanban": "opinion",
  "sticky-kanban": "opinion",
  "doc-section": "synthetic",
  "props-table": "synthetic",
  heuristic: "synthetic",
  iframe: "synthetic",
  comparison: "order",
  "scatter-chart": "opinion",
  "line-chart": "opinion",
  "stacked-bar-chart": "opinion",
  "stats-table": "synthetic",
  gallery: "synthetic",
  "construct-entry": "synthetic",
  "mega-menu": "synthetic",
} satisfies Record<Construct["type"], ConstructTier>;

export function constructTier(type: Construct["type"]): ConstructTier {
  return BLOCK_TIER[type];
}

// Type-level cross-check, both directions: every block type marked "opinion" above must be one of
// @rebar-ui/placement's real OpinionConstructType members, and every real OpinionConstructType member must
// be marked "opinion" above. Either direction failing turns the corresponding assertion type into
// `never`, and `never` can't hold the literal `true` below — a `tsc --noEmit` failure, not a
// silent drift.
type OpinionEntriesHere = {
  [K in keyof typeof BLOCK_TIER]: (typeof BLOCK_TIER)[K] extends "opinion" ? K : never;
}[keyof typeof BLOCK_TIER];

type _NoExtraOpinionsHere = Exclude<OpinionEntriesHere, OpinionConstructType> extends never ? true : never;
type _NoMissingOpinionsHere = Exclude<OpinionConstructType, OpinionEntriesHere> extends never ? true : never;
const _noExtraOpinionsHere: _NoExtraOpinionsHere = true;
const _noMissingOpinionsHere: _NoMissingOpinionsHere = true;
void _noExtraOpinionsHere;
void _noMissingOpinionsHere;
