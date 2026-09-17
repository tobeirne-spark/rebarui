import { Alert, Box, Carousel, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const FINAL_SHOTS = [
  { key: "antd-simple-final", label: "antd · Simple (round 17)" },
  { key: "rebar-ui-simple-final", label: "rebar-ui · Simple (round 17)" },
  { key: "antd-composite-final", label: "antd · Composite (round 14)" },
  { key: "rebar-ui-composite-final", label: "rebar-ui · Composite (round 14)" },
  { key: "antd-complex-final", label: "antd · Complex (round 13)" },
  { key: "rebar-ui-complex-final", label: "rebar-ui · Complex (round 13)" },
] as const;

const INTRO_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Does iteration change the winner?",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Everything measured elsewhere on this site is one build. The real question a single build can't answer: once realistic follow-up work (add a field, reorder content, add a note, change an option) is layered on round after round, does antd's head start survive, or does rebar-ui's pay-once-at-migration cost structure eventually overtake it? Rather than stop at an arbitrary round count, each tier was iterated until it actually crossed over — a measured answer, not an extrapolation.",
      },
      {
        kind: "text",
        text: "*Condition A — antd direct.* Build the UI against Ant Design components, then apply one follow-up prompt per round, repeated until crossover.",
      },
      {
        kind: "text",
        text: "*Condition B — rebar-ui, then migrate once.* Build the same UI headless with rebar-ui, apply the identical follow-up prompts, then reimplement it directly in antd once at the end (the migration step — see below for why this isn't a codemod run here).",
      },
      {
        kind: "list",
        items: [
          "*Simple* — A settings form — a handful of fields, one submit action.",
          "*Composite* — A list view with filters, a modal, and inline validation.",
          "*Complex* — A multi-step wizard: table + form + confirmation dialog + tabs.",
        ],
      },
    ],
  },
];

const CHART_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Cumulative marginal cost per round (Claude, harness-subtracted)",
    body: [
      {
        kind: "text",
        text: "\"rebar-ui + migration\" adds the one-time migration cost to round 0, so the two lines are comparable at every round, not just at the end. Green marker = the round where rebar-ui + migration first becomes cheaper than antd.",
      },
    ],
  },
  { type: "doc-section", heading: "Complex — crosses over at round 13", level: 3, body: [] },
  {
    type: "line-chart",
    ariaLabel: "Line chart: Complex tier cumulative cost over 13 rounds, antd and rebar-ui+migration cross at round 13, rebar-ui+migration cheaper from then on",
    xLabels: ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R12", "R13"],
    labelStep: 2,
    crossoverIndex: 13,
    series: [
      { label: "antd", color: "var(--rebar-color-text-secondary, #757575)", values: [9389, 18915, 28997, 38707, 48794, 58583, 68327, 78324, 88403, 98256, 108356, 118498, 128465, 138439] },
      { label: "rebar-ui + migration", color: "var(--rebar-color-primary, #0066cc)", values: [19740, 28538, 37946, 46808, 55777, 64794, 73762, 82941, 91979, 101105, 110355, 119482, 128564, 137756], dashed: true },
    ],
  },
  { type: "doc-section", heading: "Composite — crosses over at round 14", level: 3, body: [] },
  {
    type: "line-chart",
    ariaLabel: "Line chart: Composite tier cumulative cost over 14 rounds, antd and rebar-ui+migration cross at round 14, rebar-ui+migration cheaper from then on",
    xLabels: ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R12", "R13", "R14"],
    labelStep: 2,
    crossoverIndex: 14,
    series: [
      { label: "antd", color: "var(--rebar-color-text-secondary, #757575)", values: [9293, 18385, 27803, 36965, 46744, 56766, 66211, 75793, 85301, 94966, 104490, 114007, 123665, 133184, 142981] },
      { label: "rebar-ui + migration", color: "var(--rebar-color-primary, #0066cc)", values: [19217, 27727, 36424, 45004, 53698, 62672, 71406, 80155, 89092, 97923, 106768, 115608, 124695, 133547, 142584], dashed: true },
    ],
  },
  { type: "doc-section", heading: "Simple — crosses over at round 17", level: 3, body: [] },
  {
    type: "line-chart",
    ariaLabel: "Line chart: Simple tier cumulative cost over 17 rounds, antd and rebar-ui+migration cross at round 17, rebar-ui+migration cheaper from then on",
    xLabels: ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R12", "R13", "R14", "R15", "R16", "R17"],
    labelStep: 2,
    crossoverIndex: 17,
    series: [
      { label: "antd", color: "var(--rebar-color-text-secondary, #757575)", values: [8472, 17608, 26401, 35562, 44704, 53858, 63302, 72390, 81560, 90790, 100432, 109699, 119256, 128589, 138453, 147986, 157701, 167673] },
      { label: "rebar-ui + migration", color: "var(--rebar-color-primary, #0066cc)", values: [17527, 25954, 34449, 42912, 51477, 59989, 68559, 77227, 85957, 94747, 103551, 112342, 121329, 130307, 139257, 148955, 157855, 166797], dashed: true },
    ],
  },
];

export default function IterationPage() {
  return (
    <Stack gap="md">
      <NextBlockRenderer blocks={INTRO_BLOCKS} />

      <Alert type="warning" title="Rigid by design: rebar-ui is meant to refuse style/color requests">
        rebar-ui is deliberately rigid — closer to rebar and formwork in real construction than
        a flexible styling toolkit: it builds the load-bearing structure (logic, accessibility,
        content) correctly, then refuses to let that structure be visually fine-tuned before
        the &quot;cladding&quot; goes on, once, at migration. So when the first follow-up
        prompt here tried a pure restyle (&quot;make this button softer, add padding&quot;),
        two of three rebar-ui agents refused it outright — working exactly as intended: the
        placement schema has no per-instance color/style override, and inventing one would
        mean fabricating an API that doesn&apos;t exist. The third was explicitly told it could
        edit shared files to satisfy the request — overriding that rigidity on purpose, to see
        what happens. What happened is exactly the failure mode the rigidity exists to prevent:
        it made the restyle work, but by editing shared <code>packages/core</code> CSS and{" "}
        <code>BlockRenderer.tsx</code>, and in the process made a second, undisclosed, unrelated
        change to a shared button style. That edit was reverted immediately; nothing from it is
        in the numbers below, and the library&apos;s own docs now state the refusal as an
        explicit rule rather than leaving it to an individual agent&apos;s judgment. Every round
        below was redesigned around content/structure changes instead (add a field, reorder,
        add a note, change an option, cycling through those four types) — requests both
        architectures can actually express.
      </Alert>

      <NextBlockRenderer blocks={CHART_BLOCKS} />

      <Alert type="info" title="All three tiers cross over — between round 13 and round 17">
        Complex crosses first (round 13: antd 138,439 vs rebar-ui+migration 137,756), Composite
        next (round 14: 142,981 vs 142,584), Simple last (round 17: 167,673 vs 166,797). The
        more complex the spec, the sooner migration pays for itself — consistent with
        rebar-ui&apos;s per-round saving being roughly proportional to how much content a round
        touches, while the one-time migration cost only grows sub-linearly with complexity. Not
        a smooth countdown: round 15 on the Simple tier briefly widened the gap instead of
        closing it (a single round&apos;s real cost swung the other way that time) before
        resuming its close — a visible reminder that any one round is still an n=1 measurement,
        even though the multi-round trend across three independently-run tiers is consistent.
      </Alert>

      <Stack gap="xs">
        <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
          Final state (post-crossover), one representative build per condition
        </Text>
        <Carousel aria-label="Iteration experiment final screenshots">
          {FINAL_SHOTS.map((shot) => (
            <Box key={shot.key} style={{ maxWidth: 360, margin: "0 auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/benchmark-screenshots-iteration/${shot.key}.png`}
                alt={shot.label}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <Text size="xs" color="secondary" style={{ textAlign: "center" }}>
                {shot.label}
              </Text>
            </Box>
          ))}
        </Carousel>
      </Stack>

      <Text size="xs" color="secondary">
        <strong>Caveats:</strong> n=1 per round per condition (97 dispatches total across all
        three tiers) — a single round&apos;s number can swing (see round 15&apos;s temporary
        reversal above), so the exact crossover round for any tier could land a little earlier
        or later on a repeat. Migration here is a full LLM rewrite to equivalent antd code, not
        a partial codemod pass, so it&apos;s a real, fully-counted cost, not an underestimate.
        Every final state typechecked and was Playwright-verified.
      </Text>

      <Alert type="info" title="A structural head start worth naming: models haven't been trained on rebar-ui">
        Every number measured on this site compares a library the model has seen constantly in
        training (antd) against one it has never seen at all (rebar-ui, and the{" "}
        <code>@rebar-ui/placement</code> schema specifically). That&apos;s not a flaw in the
        comparison — it&apos;s the placement layer&apos;s whole point: a small, generic schema
        needs far less training familiarity to use well than a large component API does, which
        is why rebar-ui already wins despite zero training exposure. But it does mean
        today&apos;s numbers likely understate rebar-ui&apos;s ceiling, not overstate it — the
        image-prompt experiment shows a real, measurable &quot;unfamiliar schema&quot; tax
        (extra lookup calls before the prompt was refined to spell the schema out directly). If
        a future model were actually trained on examples of this schema, that residual tax would
        plausibly shrink further, on top of the advantage already measured here — a directional
        expectation, not something this page has tested.
      </Alert>
    </Stack>
  );
}
