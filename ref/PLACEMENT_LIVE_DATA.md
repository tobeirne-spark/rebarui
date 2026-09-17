---
title: A live-data binding mechanism for @rebar-ui/placement — a scoped future direction
status: proposal, not implemented — written up for evaluation, not scheduled
---

# A live-data binding mechanism for the placement layer

## The finding that prompted this

Building Coherence (a real RAG console — chat, document upload/processing, chunk search — against
a real FastAPI backend) through rebar-ui, twice, in two independent rebuilds (`ref/Tom_v2.md`
covers both in detail), neither build ever imported `BlockRenderer`/`Block[]` from
`@rebar-ui/placement` at all, despite it being a listed dependency in both. Every view was
hand-authored `rebar-ui` component JSX instead. Checked directly, not assumed: `grep -rn
"@rebar-ui/placement\|BlockRenderer" web/src web-v2/src` returns nothing in either app.

This traces to a real, structural fact about the `Block` union (`packages/placement/src/
schema.ts`), not an oversight either build made independently: **every block is plain, static,
JSON-serializable data, fixed at author time.** `ai-chat`'s `messages: AiChatMessageData[]` is a
literal array — there's no `onSend`, no streaming hook, no way to wire it to a real backend.
`table`'s own doc comment says so explicitly: even its `addable` flow is "local state only...
since the block schema has no persistence layer of its own." This is exactly right for what the
Packer is actually used for today — `apps/docs` itself, composing marketing copy, docs prose, and
canned examples — but it means the Packer, as it exists now, **cannot express a single view of a
real, live, backend-driven product app**. `robot.md`'s own stated exception ("a genuinely
interactive widget... hand-author that piece, print everything else") isn't being stretched
incorrectly here — for an app where every view is live state, that exception necessarily swallows
the whole app, because none of it is static content.

`packages/core/README.md`'s current framing — "if the task is 'build a UI with rebar-ui'... use
the placement layer instead" — doesn't scope itself to static/content pages, and should probably
say so explicitly regardless of whether the mechanism below is ever built. That's a cheap, separate
fix, not blocked on anything here.

## The actual gap

A `Block` can describe *what's on the page*, but has no way to describe:
1. **A live data source** — "these table rows come from `GET /kbs/{id}/documents`," not "these
   rows are `[{...}, {...}]` fixed at author time."
2. **A live event handler** — "sending a chat message calls this function and streams the reply
   into this same block's state," not nothing.

Both are fundamentally at odds with `Block[]` being plain JSON (serializable, diffable, storable,
generatable by an LLM in one shot) — a real function or a live fetch can't be embedded in JSON.
Any real mechanism has to bridge that without giving up the JSON-ness of the block data itself.

## Proposed shape: named indirection, resolved by the renderer

`Block` data keeps referencing things **by string key**, never by value. A new, separate prop on
`BlockRenderer` — not on the block data itself — supplies what those keys actually resolve to at
render time, provided by the real, hand-authored app code that owns the live state:

```ts
// Block data — still plain JSON, still generatable/storable/diffable exactly as today.
{
  type: "ai-chat",
  title: "Chat",
  source: "chatMessages",     // <- new: a data-source key, not a literal array
  onSend: "sendChatMessage",  // <- new: a handler key, not a function
}

// The consuming app's own code (necessarily real, hand-authored, holding real state):
<BlockRenderer
  blocks={blocks}
  data={{ chatMessages: messages }}                 // live values, keyed
  handlers={{ sendChatMessage: handleSend }}         // real functions, keyed
/>
```

`BlockRenderer` looks up `source`/`onSend` (etc.) in the `data`/`handlers` maps it's given, and
wires the resolved live value/function into the same underlying component
(`ChatThread`/`AiChatInput`) it already renders for the static case. **A block with a literal
`messages` array (today's shape) keeps working unchanged** — `source` is additive, not a breaking
replacement; a block that sets neither is exactly as static as it is today.

This is the same *pattern* already used for handling client-side routing
(`renderLink`/`BlockRenderer`'s own `Link`-passthrough prop) — a real function supplied outside the
serializable data, referenced from inside it only by name/position — extended from "one blessed
callback for links" to "any block-appropriate data source or handler."

## What this would need per block type (sketch, not a full spec)

- `ai-chat`: `source` → `ChatMessage[]`; `onSend` → `(value: string) => void`. Streaming updates
  are just the consumer mutating the array behind `source` the same way `ChatView` already does
  today for the hand-authored case — `BlockRenderer` doesn't need to know anything changed, React's
  own re-render handles it.
- `table`: `source` → `TableRow[]`; optional `onRowAction`/per-column `onCellAction` → a keyed
  handler, resolving the exact "count column becomes a drill-down link" case
  (`ref/HEURISTICS.md` #54) generically instead of per-app.
- `form`: `onSubmit` → a keyed handler receiving the form's values, replacing today's
  submit-does-nothing placeholder.
- `filter-bar`/`data-list`: `source` for `data-list`'s `items`; `onSearch`/`onFilterChange` for
  `filter-bar`.

## Open questions — real ones, not yet answered

- **Loading/error states.** A live `source` needs a way to express "still loading" / "failed" —
  either the consumer resolves that itself before handing `data` to `BlockRenderer` (simplest, but
  means every block that supports `source` needs its own loading/error sub-shape convention), or
  `BlockRenderer` grows a small, generic `AsyncState<T>` convention (`{status, value, error}`)
  every live-capable block shares. Needs a real design pass, not a guess.
- **Does this actually help, measured?** This project's own discipline (`ref/BENCHMARK_CONTRIBUTING.md`)
  is verify empirically before trusting a claim. The Packer's whole value proposition today is
  measured against static-content pages; whether Block-plus-indirection genuinely beats
  hand-authored components for a *live* app — on tokens, wall-clock, and consistency, the same
  three axes `/benchmarks` already measures — is a real open question, not an assumption to import
  from the static-page result. A live-app benchmark condition would need to exist before adopting
  this for real, matching how every other Packer claim on this project's site is backed by a
  measured condition, not asserted.
- **Scope creep risk.** It would be easy for `source`/`onX` to slowly reinvent a general-purpose
  app framework inside the block schema, one indirection at a time. The right discipline is
  probably: add a live binding to a block type only when a real app (like this one) needs it, the
  same "don't build ahead of demand" rule `icons.tsx`/`assets/` already follow — not speculatively
  wire every block type up front.

## Non-goals for this document

Not a commitment to build this. Not scheduled. Written up so the finding (Coherence's two rebuilds
both bypassing the Packer entirely, for a structural reason rather than an agent's oversight) has a
real place to live and a concrete shape to evaluate against, rather than being lost as a single
conversation-turn observation.
