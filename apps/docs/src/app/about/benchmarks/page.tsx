import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";
import { Image, Stack } from "rebar-ui";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Does building with AI on rebar-ui actually save you money?",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Short answer: yes — real, measured savings on every model and every prompt style we've tested, from a few percent on a frontier model up to roughly three-quarters cheaper on a budget one. Everything on this page is a real number pulled from real API usage, not a guess — the methodology and every underlying data point are still here for anyone who wants to check our work, further down the page.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The short answer",
    body: [
      {
        kind: "text",
        text: "*Building the same UI with rebar-ui instead of hand-written antd costs less, every time we've measured it* — 3-5% cheaper on a top-tier model like Claude, and 25-75% cheaper on cheaper models like Qwen and Kimi. The cheaper the model you're using, the bigger rebar-ui's advantage — because most of what a model struggles with when hand-writing a UI is layout and composition decisions, and rebar-ui removes those decisions from the job entirely.",
      },
      {
        kind: "text",
        text: "The one thing rebar-ui doesn't do is look like a finished product out of the box — it's deliberately plain until you (or an agent) migrate it to a real design system once, at the end. That migration has a real cost, so the honest question is whether the savings along the way actually earn it back. We measured that too, round by round, rather than guessing: on Claude, it takes 13-17 rounds of revisions before rebar-ui (even counting the full cost of migrating away from it) is cheaper than antd was ever going to be. Most real projects go through more revisions than that before they ship — and if you're building something you'll never bother re-skinning at all (an internal tool, a prototype), there's no migration cost to earn back in the first place, so rebar-ui is simply cheaper, full stop. See [what this costs you](/about/benchmarks/scenarios) for what that looks like in real dollars.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Conclusion",
    body: [
      {
        kind: "text",
        text: "If you're deciding whether to build with rebar-ui or hand-code against antd directly: on every model and prompt style we've tested, rebar-ui costs less and renders more consistently, from the very first build. The cheaper the model you're using, the more that matters — the gap ranges from a few percent on a frontier model up to three-quarters cheaper on a budget one.",
      },
      {
        kind: "text",
        text: "The one real cost on rebar-ui's side is migrating to a proper design system once you're done iterating — and we measured how long that takes to pay for itself rather than guess: 13-17 rounds of revisions, depending on complexity. Most real projects go through more revisions than that. If you're building something you won't re-skin at all, there's nothing to pay back in the first place, and rebar-ui is simply the cheaper choice throughout.",
      },
      {
        kind: "text",
        text: "Worth knowing: every number on this page compares a library the model has trained on constantly (antd) against one it's never seen before (rebar-ui) — a genuinely unfair comparison in rebar-ui's favor, if anything, since it still wins despite that disadvantage. What we'd still like to test: the same round-by-round migration payoff on Qwen and Kimi, not just Claude; a wider range of app types beyond the three we picked; and a fourth model, to see how far the \"cheaper model, bigger gap\" pattern actually goes.",
      },
    ],
  },
];

export default function BenchmarksPage() {
  return (
    <Stack gap="lg">
      <Image
        src="/catalogue-heros/benchmark.jpeg"
        alt="Benchmarks hero image"
        style={{ width: "100%", borderRadius: "8px" }}
      />
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
