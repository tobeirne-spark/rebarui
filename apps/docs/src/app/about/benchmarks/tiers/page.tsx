import { Alert, Box, Carousel, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const TIER_SHOTS = [
  { key: "claude-antd-simple", label: "Claude · antd · Simple" },
  { key: "claude-rebar-ui-simple", label: "Claude · rebar-ui · Simple" },
  { key: "qwen-antd-simple", label: "Qwen · antd · Simple" },
  { key: "qwen-rebar-ui-simple", label: "Qwen · rebar-ui · Simple" },
  { key: "claude-antd-composite", label: "Claude · antd · Composite" },
  { key: "claude-rebar-ui-composite", label: "Claude · rebar-ui · Composite" },
  { key: "qwen-antd-composite", label: "Qwen · antd · Composite" },
  { key: "qwen-rebar-ui-composite", label: "Qwen · rebar-ui · Composite" },
  { key: "claude-antd-complex", label: "Claude · antd · Complex" },
  { key: "claude-rebar-ui-complex", label: "Claude · rebar-ui · Complex" },
  { key: "qwen-antd-complex", label: "Qwen · antd · Complex" },
  { key: "qwen-rebar-ui-complex", label: "Qwen · rebar-ui · Complex" },
] as const;

const INTRO_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Simple, Composite, Complex tiers",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Three complexity tiers beyond the single fixed component in [the receipts](/about/benchmarks/receipts) — text-prompt only, run against both Claude and Qwen. These specs needed six blocks not yet exercised above (`form`, `table`, `data-list`, `filter-bar`, `tabs`, `modal`), and Claude's numbers here are \"marginal\" — total tokens minus the ~20,644-token shared harness overhead every Claude Code session pays, so they're comparable in kind to Qwen's raw completion totals.",
      },
    ],
  },
];

const RESULT_BLOCKS: Construct[] = [
  { type: "doc-section", heading: "Claude (marginal tokens, n=5)", body: [] },
  {
    type: "scatter-chart",
    ariaLabel: "Scatter plot: Claude marginal tokens across three tiers, antd vs rebar-ui, rebar-ui consistently lower in each tier",
    series: [
      { label: "antd·Simple", color: "var(--rebar-color-text-secondary, #757575)", values: [6767, 8500, 8399, 8456, 8399] },
      { label: "rebar·Simple", color: "var(--rebar-color-primary, #0066cc)", values: [6676, 8327, 8327, 8340, 8327] },
      { label: "antd·Composite", color: "var(--rebar-color-text-secondary, #757575)", values: [7251, 8957, 8932, 8876, 8939] },
      { label: "rebar·Composite", color: "var(--rebar-color-primary, #0066cc)", values: [7004, 8782, 8730, 8762, 8730] },
      { label: "antd·Complex", color: "var(--rebar-color-text-secondary, #757575)", values: [7602, 9736, 9292, 9146, 9165] },
      { label: "rebar·Complex", color: "var(--rebar-color-primary, #0066cc)", values: [7384, 9052, 9073, 9017, 9040] },
    ],
  },
  {
    type: "stats-table",
    headers: ["Tier", "Condition", "Mean (marginal)", "Difference"],
    rows: [
      ["Simple", "antd", "8,104", "—"],
      ["", "rebar-ui", "7,999", "−1.3%"],
      ["Composite", "antd", "8,591", "—"],
      ["", "rebar-ui", "8,402", "−2.2%"],
      ["Complex", "antd", "8,988", "—"],
      ["", "rebar-ui", "8,712", "−3.1%"],
    ],
  },
  { type: "doc-section", heading: "Qwen (raw tokens, n=3-5)", body: [] },
  {
    type: "scatter-chart",
    ariaLabel: "Scatter plot: Qwen tokens across three tiers, antd vs rebar-ui, rebar-ui consistently lower in each tier",
    series: [
      { label: "antd·Simple", color: "var(--rebar-color-text-secondary, #757575)", values: [478, 775, 905, 1819, 3090] },
      { label: "rebar·Simple", color: "var(--rebar-color-primary, #0066cc)", values: [809, 919, 1004, 1215, 2396] },
      { label: "antd·Composite", color: "var(--rebar-color-text-secondary, #757575)", values: [619, 1839, 2126, 3967] },
      { label: "rebar·Composite", color: "var(--rebar-color-primary, #0066cc)", values: [1326, 2158, 2160] },
      { label: "antd·Complex", color: "var(--rebar-color-text-secondary, #757575)", values: [1584, 2776, 2778, 3048, 3622] },
      { label: "rebar·Complex", color: "var(--rebar-color-primary, #0066cc)", values: [1298, 1311, 1380, 2332, 2648] },
    ],
  },
  {
    type: "stats-table",
    headers: ["Tier", "Condition", "Mean", "n", "Difference"],
    rows: [
      ["Simple", "antd", "1,413", "5", "—"],
      ["", "rebar-ui", "1,269", "5", "−10.2%"],
      ["Composite", "antd", "2,138", "4", "—"],
      ["", "rebar-ui", "1,881", "3", "−12.0%"],
      ["Complex", "antd", "2,762", "5", "—"],
      ["", "rebar-ui", "1,794", "5", "−35.0%"],
    ],
  },
];

export default function TiersPage() {
  return (
    <Stack gap="md">
      <NextBlockRenderer blocks={INTRO_BLOCKS} />

      <Alert type="warning" title="Why this section only has n=5, not n=15">
        A single-run first pass here briefly looked like the two models disagreed on which
        tool wins. Repeating those runs showed that was just sampling noise, not a real
        disagreement — so we scaled up to n=5 per condition (n=3-4 on two cells that hit
        repeated technical failures, not silently dropped) before trusting the direction. Both
        models agree, all three tiers, once the sample is big enough — n=5 is still a smaller,
        less certain sample than the n=15 experiments elsewhere on this site.
      </Alert>

      <NextBlockRenderer blocks={RESULT_BLOCKS} />

      <Alert type="info" title="Both models agree once the sample is large enough">
        rebar-ui wins all three tiers on both models — a modest 1.3-3.1% on Claude, a much
        larger 10.2-35.0% on Qwen, the same bigger-gap-on-the-cheaper-model pattern found in
        the main n=15 experiments elsewhere on this site.
      </Alert>

      <Stack gap="xs">
        <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
          One representative build per condition (final run of each n=5 batch)
        </Text>
        <Carousel aria-label="Simple/Composite/Complex tier screenshots">
          {TIER_SHOTS.map((shot) => (
            <Box key={shot.key} style={{ maxWidth: 360, margin: "0 auto" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/benchmark-screenshots-tiers/${shot.key}.png`}
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
        <strong>Caveats:</strong> n=5 per condition (n=3-4 for two Qwen composite cells), one
        day (2026-08-29/30). All builds typechecked and were Playwright-verified (clean render,
        zero console errors beyond antd&apos;s already-noted deprecation warning). Claude was
        instructed to build one-shot (no file exploration, no self-verification) each run,
        confirmed genuinely one-shot afterward (exactly one tool call per run), to mirror what
        Qwen&apos;s raw completion call structurally can&apos;t do either way.
      </Text>
    </Stack>
  );
}
