import { Alert, Stack } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SECTIONS = [
  { id: "1-the-whole-picture-vibe-coding-vs-hiring-developers", label: "1. Vibe coding vs. hiring developers" },
  { id: "2-build-with-claude-migrate-once", label: "2. Build with Claude, migrate once" },
  { id: "3-4-the-same-build-on-a-cheaper-model", label: "3 & 4. A cheaper model" },
  { id: "5-an-internal-tool-you-ll-never-re-skin", label: "5. An internal tool you'll never re-skin" },
  { id: "6-reverse-engineering-an-incumbent-enterprise-app", label: "6. Reverse-engineering an enterprise app" },
];

const INTRO_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "What this actually costs you",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Six realistic ways people actually build things, each priced with real, current API rates (Claude Sonnet 5: $2/$10 per million input/output tokens; Qwen3.7: $2.50-7.50/MTok depending on tier; Kimi-K3: $3/$15 per MTok — all current list prices as of this writing). The token counts behind every dollar figure are the same real, measured data in [the receipts](/about/benchmarks/receipts) — nothing here is invented for effect. Where we scale a measured result up to a more realistic project size, we say so plainly.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "1. The whole picture: vibe coding vs. hiring developers",
    body: [
      {
        kind: "text",
        text: "Everything else on this page compares token costs. This one compares the actual decision a small team faces: hire developers to build an internal app, or build it with an AI coding agent and rebar-ui. Worked example — *a company timesheet tool*, seven screens: Dashboard, Time Entry, Manager Approvals, Reports, Project/Client Admin, User Settings, Leave Requests. Stated assumptions throughout, so you can plug in your own numbers if ours don't match your situation:",
      },
      {
        kind: "text",
        text: "*Developer rate:* $100/hr — a round figure inside the real market range for a mid-level full-stack contractor ($81-135/hr, per current rate-tracking sites), used for both sides of this comparison, including the human time an AI-assisted build still needs.",
      },
      {
        kind: "text",
        text: "*Revisions:* 6 rounds of stakeholder feedback per screen before the team is happy shipping it — a deliberately ordinary number for getting a first version of an internal tool out the door, not the 13-17-round figure used elsewhere on this page for \"how long until a migration pays for itself\" (a different question this scenario doesn't need to answer, since a timesheet tool is exactly the kind of internal app nobody re-skins — see scenario 5).",
      },
    ],
  },
  { type: "doc-section", heading: "Traditional: hire developers", level: 3, body: [] },
  {
    type: "stats-table",
    headers: ["Line item", "Estimate", "Cost"],
    rows: [
      ["Initial build (7 screens × 3 days)", "21 days", "$16,800"],
      ["Revisions (42 rounds × 0.5 day)", "21 days", "$16,800"],
      ["UX/design pass (whole app, once)", "5 days", "$4,000"],
      ["Total", "47 days", "$37,600"],
    ],
  },
  { type: "doc-section", heading: "AI-assisted: Claude + rebar-ui, with a real human still in the loop", level: 3, body: [] },
  {
    type: "stats-table",
    headers: ["Line item", "Estimate", "Cost"],
    rows: [
      ["API cost (7 screens, 42 revision rounds, real measured tokens)", "429,000 tokens", "$1.38"],
      ["Human time: prompt + review each screen (2 hrs × 7)", "14 hrs", "$1,400"],
      ["Human time: describe + verify each revision (30 min × 42)", "21 hrs", "$2,100"],
      ["Total", "35 hrs", "$3,501"],
    ],
  },
  { type: "doc-section", heading: "The same six line items, drawn to scale", level: 3, body: [] },
  {
    type: "stacked-bar-chart",
    ariaLabel: "Stacked bar chart comparing the cost composition of hiring developers ($37,600) versus AI-assisted development ($3,501) for the timesheet tool",
    bars: [
      {
        label: "Hire developers",
        segments: [
          { label: "Initial build", value: 16800, color: "#1565c0" },
          { label: "Revisions", value: 16800, color: "#1e88e5" },
          { label: "Design pass", value: 4000, color: "#64b5f6" },
        ],
      },
      {
        label: "Claude + rebar-ui",
        segments: [
          { label: "Revision oversight", value: 2100, color: "#81c784" },
          { label: "Build oversight", value: 1400, color: "#43a047" },
          { label: "API cost", value: 1.38, color: "#1b5e20" },
        ],
      },
    ],
  },
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "The $1.38 API cost is the sliver at the very bottom of the right-hand bar — too thin to label. Almost the entire AI-assisted cost is human oversight time, not tokens; it's still roughly a tenth the size of the traditional bar next to it.",
      },
    ],
  },
];

const SCENARIO_1_TAIL_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "*What this doesn't include:* project management overhead, code review, and QA time are folded into the day estimates above, not added separately — a real team with more process overhead would widen this gap further, not close it. Per-screen token costs are the same real, measured Composite-tier numbers used throughout this page (see [the tiers section](/about/benchmarks/tiers)), scaled to 7 screens × 6 rounds — a stated scaling, not a new measurement. Swap in your own day rate, revision count, or screen count; the model is simple enough to redo by hand.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "2. Build with Claude, migrate once",
    body: [
      {
        kind: "text",
        text: "The most direct comparison: build the same app with Claude, one condition hand-coded in antd, the other headless in rebar-ui and migrated to antd once revisions settle down. Real, measured token counts through each tier's actual crossover round, priced at Claude's real rates.",
      },
    ],
  },
  {
    type: "stats-table",
    headers: ["Tier", "Rounds to break even", "antd, direct", "rebar-ui + migration", "You save"],
    rows: [
      ["Complex", "13", "$0.467", "$0.444", "5.0%"],
      ["Composite", "14", "$0.483", "$0.460", "4.8%"],
      ["Simple", "17", "$0.566", "$0.538", "5.0%"],
    ],
  },
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "These are small dollar amounts because our test spec is small — the point is the percentage, which holds regardless of how big your real project is. Past the break-even round, every additional round of revisions just widens the gap.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "3 & 4. The same build, on a cheaper model",
    body: [
      {
        kind: "text",
        text: "We haven't run the full round-by-round migration experiment on Qwen or Kimi yet — only Claude, so far. What we do have is the real one-shot build cost on both, and it tells you a lot on its own:",
      },
    ],
  },
  {
    type: "stats-table",
    headers: ["Model", "antd, direct", "rebar-ui", "You save"],
    rows: [
      ["Qwen3.7", "$0.024", "$0.006", "73.1%"],
      ["Kimi-K3", "$0.085", "$0.021", "74.8%"],
    ],
  },
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "On Claude, rebar-ui's one-shot saving is only ~3%, which is why migrating away from it takes 13+ rounds to earn back. On Qwen and Kimi, the one-shot saving alone is already bigger than Claude's *entire* 13-17-round gap — so if a similar per-round pattern holds on these models (not yet measured directly), migrating away from rebar-ui would likely pay for itself almost immediately, not after over a dozen rounds. That's a reasoned inference from real numbers, not a second measurement — flagged as exactly that.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "5. An internal tool you'll never re-skin",
    body: [
      {
        kind: "text",
        text: "Plenty of real software is never going to get a design pass — an internal ops dashboard, an admin panel, a tool three people on your team use. If you're never migrating away from rebar-ui, there's no migration bill to earn back — it's just cheaper, every single round, from day one. Modeled on our Composite-tier spec's real one-shot cost and real measured per-round revision cost, extended out (Claude pricing):",
      },
    ],
  },
  {
    type: "stats-table",
    headers: ["After this many revision rounds", "antd, direct", "rebar-ui, never migrated", "You save"],
    rows: [
      ["5", "$0.190", "$0.169", "11.1%"],
      ["20", "$0.674", "$0.595", "11.6%"],
      ["50", "$1.641", "$1.448", "11.8%"],
    ],
  },
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "This is the strongest case for rebar-ui, and the simplest: skip the \"will it earn back the migration cost\" question entirely by never paying that cost. Real teams building internal tools this way, at real scale (many tools, many teams), see this saving multiply directly.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "6. Reverse-engineering an incumbent enterprise app",
    body: [
      {
        kind: "text",
        text: "A common real job: recreate a screen from an existing enterprise platform you don't own the code for — a dense, multi-panel record page in the style of a Salesforce-class CRM — working from what's on screen, the same way our real image-to-code experiment works from a reference screenshot rather than a written spec. We haven't rebuilt an actual named product (nor would we claim to) — this scales our real, measured Complex-tier result by a stated 3x, a conservative estimate of how much denser a real enterprise record screen is than our test spec, using an unnamed frontier model priced at Claude's real rates:",
      },
    ],
  },
  {
    type: "stats-table",
    headers: ["Screen density", "antd, direct", "rebar-ui", "You save"],
    rows: [
      ["Our test spec (1x)", "$0.030", "$0.028", "7.4%"],
      ["Modeled enterprise screen (3x)", "$0.091", "$0.084", "7.4%"],
      ["A denser screen (5x)", "$0.152", "$0.140", "7.4%"],
    ],
  },
  {
    type: "doc-section",
    body: [
      {
        kind: "text",
        text: "The percentage doesn't change with density in this simple model — real screens won't scale perfectly linearly, but the direction (rebar-ui cheaper, reading a screenshot or reading a spec) is the same effect measured twice, not assumed once.",
      },
    ],
  },
];

export default function ScenariosPage() {
  return (
    <Stack direction="row" gap="xl" style={{ alignItems: "flex-start" }}>
      <Stack gap="md" style={{ flex: 1, minWidth: 0, maxWidth: 800 }}>
        <NextBlockRenderer blocks={INTRO_BLOCKS} />

        <Alert type="info" title="Traditional development costs about 10.7x more">
          <strong>$37,600 to hire developers, versus $3,501 to direct an AI agent</strong> —
          90.7% cheaper. Notice what that AI-assisted total is actually made of: $1.38 of real
          API cost and $3,500 of human time. The API cost is close to a rounding error — the
          real, remaining cost of AI-assisted development is the human still needed to prompt,
          review, and verify the output, not the tokens themselves. We&apos;re not claiming AI
          removes the human from the loop; we&apos;re claiming it removes the need to hire a
          team to hand-write every screen and sit through 42 rounds of manual rework.
        </Alert>

        <NextBlockRenderer blocks={SCENARIO_1_TAIL_BLOCKS} />
      </Stack>
      <NextBlockRenderer blocks={[{ type: "page-index", sections: SECTIONS }]} />
    </Stack>
  );
}
