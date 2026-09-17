import { Alert, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const INTRO_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Qwen3.7 (n=15 per condition)",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Same spec, same blocks, same rigor — run against Qwen (qwen3.7-max for text, qwen3.7-plus for image) via the DashScope API, to test whether a cheaper model benefits even more from having layout/composition decisions removed from it.",
      },
    ],
  },
];

const RESULT_BLOCKS: Construct[] = [
  { type: "doc-section", heading: "Text prompt", body: [] },
  {
    type: "scatter-chart",
    ariaLabel: "Scatter plot: Qwen text-prompt tokens, antd (spread 1,597-6,446, mean 3,388) vs rebar-ui (tighter, 994-2,028, mean 1,228)",
    series: [
      { label: "antd (n=15)", color: "var(--rebar-color-text-secondary, #757575)", values: [1597, 1626, 2187, 2463, 2509, 2538, 2692, 2989, 3283, 3431, 4167, 4633, 4934, 5321, 6446] },
      { label: "rebar-ui (n=15)", color: "var(--rebar-color-primary, #0066cc)", values: [994, 996, 1016, 1033, 1043, 1047, 1052, 1065, 1161, 1262, 1276, 1472, 1482, 1495, 2028] },
    ],
  },
  {
    type: "stats-table",
    headers: ["Condition", "Mean", "Median", "Min", "Max", "Std. dev.", "Success"],
    rows: [
      ["antd", "3,388", "2,989", "1,597", "6,446", "1,376 (40.6%)", "15/15"],
      ["rebar-ui", "1,228", "1,065", "994", "2,028", "278 (22.6%)", "15/15"],
    ],
  },
  {
    type: "stats-table",
    headers: ["Wall-clock", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd", "46.6s", "40.3s", "19.7s", "88.3s", "20.8s (44.6%)"],
      ["rebar-ui", "10.3s", "9.4s", "6.0s", "21.7s", "3.9s (37.8%)"],
    ],
  },
  { type: "gallery", label: "antd", dir: "/benchmark-screenshots-qwen", prefix: "antd-text" },
  { type: "gallery", label: "rebar-ui", dir: "/benchmark-screenshots-qwen", prefix: "rebar-ui-text" },
  { type: "doc-section", heading: "Image prompt", body: [] },
  {
    type: "scatter-chart",
    ariaLabel: "Scatter plot: Qwen image-prompt tokens, antd (spread 3,243-5,882, mean 3,948) vs rebar-ui (tighter, 2,839-3,129, mean 2,956)",
    series: [
      { label: "antd (n=15)", color: "var(--rebar-color-text-secondary, #757575)", values: [3243, 3388, 3404, 3473, 3514, 3563, 3618, 3667, 3684, 3686, 3784, 4577, 4715, 5020, 5882] },
      { label: "rebar-ui (n=15)", color: "var(--rebar-color-primary, #0066cc)", values: [2839, 2864, 2872, 2872, 2891, 2892, 2915, 2965, 2965, 2967, 2978, 2985, 3103, 3107, 3129] },
    ],
  },
  {
    type: "stats-table",
    headers: ["Condition", "Mean", "Median", "Min", "Max", "Std. dev.", "Success"],
    rows: [
      ["antd", "3,948", "3,667", "3,243", "5,882", "726 (18.4%)", "15/15"],
      ["rebar-ui", "2,956", "2,965", "2,839", "3,129", "90.3 (3.1%)", "15/15"],
    ],
  },
  {
    type: "stats-table",
    headers: ["Wall-clock", "Mean", "Median", "Min", "Max", "Std. dev."],
    rows: [
      ["antd", "33.2s", "29.2s", "20.5s", "64.6s", "11.9s (35.8%)"],
      ["rebar-ui", "13.8s", "13.9s", "11.2s", "17.6s", "1.7s (12.1%)"],
    ],
  },
  { type: "gallery", label: "antd", dir: "/benchmark-screenshots-qwen-image", prefix: "antd-image" },
  { type: "gallery", label: "rebar-ui", dir: "/benchmark-screenshots-qwen-image", prefix: "rebar-ui-image" },
];

export default function QwenPage() {
  return (
    <Stack gap="lg">
      <NextBlockRenderer blocks={INTRO_BLOCKS} />

      <Alert type="warning" title="Not directly comparable to Claude's numbers">
        Qwen&apos;s numbers come from a single raw completion call — no agentic tool use, no
        file access, none of the ~22,000-token harness overhead a Claude Code session pays on
        every run. That&apos;s why Qwen&apos;s totals (roughly 1,000-4,000 tokens) look so much
        smaller than Claude&apos;s (30,000+) — it&apos;s a thinner slice of work, not a more
        efficient model. The fair comparison is <em>within</em> Qwen&apos;s own results: antd
        vs. rebar-ui, same model, same harness.
      </Alert>

      <NextBlockRenderer blocks={RESULT_BLOCKS} />

      <Alert type="info" title="The relative gap is bigger on the cheaper model">
        On Claude, rebar-ui won by 3.1-3.3% on tokens. On Qwen, the same comparison shows a{" "}
        <strong>25-64% advantage</strong> — a much larger relative win, in the direction the
        hypothesis predicted: removing layout/composition decisions helps more when the model
        doing the composing is weaker at open-ended authoring to begin with. Two models, two
        conditions each, is a real data point in that direction, not proof the effect scales
        smoothly with model capability.
      </Alert>

      <Text size="xs" color="secondary">
        <strong>Caveats:</strong> n=15 per condition, one day (2026-08-29/30), same spec and
        blocks as the Claude experiments. All 60 runs were written to disk,
        type-checked, and a Playwright-verified subset confirmed clean render and correct DOM
        order for both extremes and the median per condition. All 60 were also screenshotted
        for the galleries above, using the same pixel-alignment method as the Claude galleries.
        antd&apos;s output shows the same deprecated <code>Alert message</code> prop found on
        Claude&apos;s antd runs. A prompt written for a general-purpose coding agent doesn&apos;t
        automatically work for a single completion call with no file access — one condition
        needed its prompt rewritten to be fully self-contained before all 15 runs passed
        cleanly; full account in <code>ref/QWEN_BENCHMARK_PROTOCOL.md</code> for anyone
        reproducing this.
      </Text>
    </Stack>
  );
}
