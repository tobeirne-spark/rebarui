import { Alert, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const TOP_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "A third, genuinely different model: Kimi-K3",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Qwen3.7 is one model family. To test whether the pattern above holds for a real architectural difference, not just another Qwen size, the same text-prompt spec was run against *Kimi-K3* (Moonshot AI, via the same DashScope-compatible endpoint) — a reasoning model, unrelated to Qwen. Same rigor as every condition above: n=15 per condition, every run written to disk and type-checked, a Playwright-verified subset for clean render and correct DOM order, full screenshot galleries.",
      },
    ],
  },
  {
    type: "scatter-chart",
    ariaLabel: "Scatter plot: Kimi-K3 text-prompt tokens, antd (spread 3,520-9,456, mean 5,967) vs rebar-ui (tighter, 1,578-2,869, mean 1,925)",
    series: [
      { label: "antd (n=15)", color: "var(--rebar-color-text-secondary, #757575)", values: [3520, 3578, 3898, 4286, 4396, 5335, 5722, 5931, 6033, 6203, 6890, 7336, 7923, 9002, 9456] },
      { label: "rebar-ui (n=15)", color: "var(--rebar-color-primary, #0066cc)", values: [1578, 1725, 1741, 1771, 1826, 1831, 1877, 1889, 1890, 1906, 1938, 1960, 2004, 2074, 2869] },
    ],
  },
  {
    type: "stats-table",
    headers: ["Condition", "Mean", "Median", "Min", "Max", "Std. dev.", "Success"],
    rows: [
      ["antd", "5,967", "5,931", "3,520", "9,456", "1,821 (30.5%)", "15/15"],
      ["rebar-ui", "1,925", "1,889", "1,578", "2,869", "278 (14.5%)", "15/15"],
    ],
  },
  {
    type: "stats-table",
    headers: ["Wall-clock", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd", "160.0s", "155.6s", "70.0s", "261.5s", "56.2s (35.1%)"],
      ["rebar-ui", "37.5s", "32.5s", "25.4s", "72.8s", "12.4s (33.0%)"],
    ],
  },
  { type: "gallery", label: "antd", dir: "/benchmark-screenshots-kimi", prefix: "antd-text" },
  { type: "gallery", label: "rebar-ui", dir: "/benchmark-screenshots-kimi", prefix: "rebar-ui-text" },
];

export default function KimiPage() {
  return (
    <Stack gap="lg">
      <NextBlockRenderer blocks={TOP_BLOCKS} />

      <Alert type="info" title="The gap is bigger here than on Qwen — and much bigger than on Claude">
        rebar-ui costs <strong>67.7% less</strong> on Kimi-K3 (vs. 63.8% on Qwen3.7-max, 3.1-3.3%
        on Claude) and finishes <strong>76.6% faster</strong>. A third model, a different vendor,
        the same direction and an even larger gap — one more real data point that removing
        layout/composition decisions helps more the further a model is from frontier-level
        open-ended authoring, not proof of a smooth scaling law across three data points.
      </Alert>

      <Alert type="warning" title="antd's cost on Kimi-K3 is genuinely unpredictable — rebar-ui's isn't">
        Look past the mean: antd&apos;s worst Kimi-K3 run cost <strong>2.7x its best one</strong>{" "}
        (3,520 to 9,456 tokens) for the exact same spec — build the identical UI twice and you
        might pay nearly three times as much the second time, for no reason you&apos;d be able
        to predict or control. rebar-ui&apos;s own spread over the same 15 runs was much
        narrower (1,578 to 2,869, a 1.8x worst-to-best ratio) — still real variance, just far
        less of it. This is the same &quot;pixel-consistency&quot; story told in tokens instead
        of pixels: a wider, less predictable range isn&apos;t just a cost problem, it&apos;s a
        planning problem — a hand-authored antd build&apos;s price is a lot harder to budget
        for than a rebar-ui one, on this model.
      </Alert>

      <Text size="xs" color="secondary">
        <strong>Caveats:</strong> n=15 per condition, 2026-08-30, same spec and blocks as
        the Claude and Qwen text-prompt experiments. Kimi-K3 was chosen after checking a
        couple of other third-party models reachable on the same platform — one produced no
        usable output at a normal token budget, another worked but cost noticeably more per
        call — so this is the one that held up. All 30 final runs typechecked and a
        Playwright-verified subset confirmed clean render and correct DOM order. antd&apos;s
        output shows the same deprecated <code>Alert message</code> prop found on every other
        antd condition on this page — harmless to rendering, a sign of antd v6 API drift the
        model&apos;s training hasn&apos;t caught up to.
      </Text>
    </Stack>
  );
}
