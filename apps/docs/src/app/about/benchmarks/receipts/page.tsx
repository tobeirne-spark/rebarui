import { Alert, Stack } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "The receipts",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Everything on [the scenarios page](/about/benchmarks/scenarios) is built from the real, repeated measurements below — same target UI, built against `antd` directly and against `rebar-ui` (always through its small procedural placement layer, never hand-authored), across two prompt styles (a written spec, a reference screenshot) and three models, n=15 per condition unless stated otherwise. If you just want the bottom line, the scenarios page already has it — this page and everything after it is for anyone who wants to verify it.",
      },
    ],
  },
  {
    type: "stats-table",
    headers: ["Experiment", "antd (mean)", "rebar-ui (mean)", "Tokens"],
    rows: [
      ["Claude · text prompt", "31,231", "30,211", "−3.3%"],
      ["Claude · image prompt", "31,765", "30,787", "−3.1%"],
      ["Qwen · text prompt", "3,388", "1,228", "−63.8%"],
      ["Qwen · image prompt", "3,948", "2,956", "−25.1%"],
      ["Kimi · text prompt", "5,967", "1,925", "−67.7%"],
      ["Average of the five", "—", "—", "−32.6%"],
    ],
  },
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "Same target component (a header, an info banner, a checklist, a warning callout) across all five, real per-turn API usage extracted from each run's own transcript, every output Playwright-verified for a clean render.",
      },
    ],
  },
  {
    type: "stats-table",
    headers: ["Experiment", "antd (mean)", "rebar-ui (mean)", "Wall-clock time"],
    rows: [
      ["Claude · text prompt", "24.5s", "14.7s", "−40.0%"],
      ["Claude · image prompt", "27.2s", "16.7s", "−38.6%"],
      ["Qwen · text prompt", "46.6s", "10.3s", "−77.9%"],
      ["Qwen · image prompt", "33.2s", "13.8s", "−58.4%"],
      ["Kimi · text prompt", "160.0s", "37.5s", "−76.6%"],
      ["Average of the five", "—", "—", "−58.3%"],
    ],
  },
  {
    type: "stats-table",
    headers: ["Experiment", "antd (pixels that vary run-to-run)", "rebar-ui (pixels that vary run-to-run)"],
    rows: [
      ["Claude · text prompt", "27.0%", "0%"],
      ["Claude · image prompt", "20.0%", "0%"],
      ["Qwen · text prompt", "30.5%", "0%"],
      ["Qwen · image prompt", "29.1%", "0%"],
      ["Average of the four", "26.7%", "0%"],
    ],
  },
];

export default function ReceiptsPage() {
  return (
    <Stack gap="lg">
      <NextBlockRenderer blocks={BLOCKS} />
      <Alert type="info" title="rebar-ui is cheaper, faster, and more visually consistent every time">
        Fewer tokens (average <strong>32.6% cheaper</strong> across five experiments), faster
        wall-clock (average <strong>58.3% faster</strong>), and pixel-identical output on the
        four experiments where antd&apos;s varies by 20-30% of pixels — never the losing side,
        not just on average. The averages above are an unweighted mean of each experiment&apos;s
        own relative difference (each already n=15, so this weights every experiment equally
        rather than pooling raw token counts across the very different scales a full agentic
        Claude session and a single-completion-call API operate on — see the per-model pages
        for why those absolute scales aren&apos;t comparable to each other directly).
      </Alert>
    </Stack>
  );
}
