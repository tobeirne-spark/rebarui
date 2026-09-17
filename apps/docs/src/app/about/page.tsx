import { Box, Heading, Image, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";
import Link from "next/link";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Making AI-assisted UI work cheaper and more predictable",
    body: [
      {
        kind: "text",
        text: "Most of what makes AI-assisted coding expensive and unpredictable isn't logic — it's UI. Layout, spacing, and composition decisions are exactly the kind of open-ended judgment call a model has to re-solve from scratch on every request, and the cost shows up twice: in tokens spent deciding, and in the variance between one run and the next. Rebar removes that decision from the job entirely — an LLM picks a named block and supplies content, the Packer decides the rest. [The measured result](/about/benchmarks) is a real, repeated (n=15) one: cheaper than hand-authored Ant Design outright, faster, and close to zero run-to-run variance, not just cheaper than hand-authoring the same thing without a design system at all.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Built for engineers, not designers",
    body: [
      {
        kind: "text",
        text: "Rebar is aimed at IT professionals and engineering teams who need to ship a real, working tool and don't want the UI layer to be where the project gets stuck. It's deliberately low-fidelity out of the box — genuinely usable and accessible, but visually plain by design — so token spend and attention go toward logic, data flow, and correctness first. Visual finish is a real, bounded step at the end (migrate once to a real design system), not an ongoing back-and-forth on an unfinished frame the whole way through.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility and consistency, not just speed",
    body: [
      {
        kind: "text",
        text: "Cheaper and faster is the headline, but it's not the point on its own. Every interactive component wraps a real Radix UI primitive underneath, so keyboard operability, focus management, and ARIA semantics are correct by construction, not bolted on. Every visual value is a `--rebar-*` CSS custom property, not a hardcoded pixel or color — which is what makes the placement layer's near-zero output variance possible in the first place: the same document renders identically every time, because the Packer decided it, not a model improvising layout from scratch.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "One visual language across an entire organization",
    body: [
      {
        kind: "text",
        text: "A real, common failure mode inside larger organizations: many different teams — sometimes many different individual engineers — building internal tools in isolation, each with its own ad hoc styling, its own inconsistent patterns, no shared visual language at all. When every one of those tools is built the same way, through the same small block vocabulary and the same token set, they converge on the same look without anyone having to coordinate it by hand. That's a genuinely different scale of consistency than one team's design system — it's every team's internal tooling looking like it came from the same place, by construction, not by a style guide everyone's expected to remember.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Taking apart incumbent enterprise platforms",
    body: [
      {
        kind: "text",
        text: "A core use case for Rebar is decomposing an incumbent enterprise platform — a large, entrenched system (a CRM, an ERP, a legacy internal tool) that's expensive to replace wholesale but painful to keep extending. Reverse-engineering the pieces you actually need into a placement-layer document is cheap precisely because the composition step is free: describe what a screen needs to do, not how it should look, and rebuild it incrementally rather than committing to a single, all-or-nothing migration. [Scenario 6 on /benchmarks](/about/benchmarks/scenarios) works through this directly, with real numbers, not just the idea of it.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Why this matters beyond one library",
    body: [
      {
        kind: "text",
        text: "The broader thesis this project is betting on: making AI-assisted UI work genuinely more efficient puts real, positive price pressure on both development and AI services generally — not because Rebar itself is special, but because of what a small, deterministic placement layer actually changes about the job. Two concrete mechanisms, not just a hope:",
      },
      {
        kind: "list",
        items: [
          "Cheaper models close the gap with premium ones. The real, measured cross-model benchmarking on this project found the gap between rebar-ui and hand-authored Ant Design is *bigger* on a budget model (Qwen, Kimi) than on a frontier one (Claude) — because most of what a cheaper model struggles with is exactly the open-ended composition work the placement layer removes from the job. A well-designed DSL layer is a lever that helps a cheaper model punch above its weight more than it helps an already-strong one.",
          "Less total compute, not just less cost per call. Composition and layout decisions currently get re-solved by a model on every single request, everywhere, by every developer independently. Moving that work into a shared, deterministic, reusable DSL layer — open source, one implementation, used by the whole developer community instead of re-derived per project — is a real reduction in the amount of inference the industry collectively needs to do to get the same UI built.",
        ],
      },
      {
        kind: "text",
        text: "This is the project's stated thesis, not a measured claim the way the token/time numbers on /benchmarks are — it's the reasoning behind why this exists, offered plainly as reasoning rather than dressed up as proof.",
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <Box as="main" style={{ maxWidth: 800, margin: "0 auto", padding: "var(--rebar-space-xl)" }}>
      <Stack gap="lg">
        <Image src="/catalogue-heros/about.jpeg" alt="About hero" style={{ width: "100%", borderRadius: "8px" }} />
        <Stack gap="xs">
          <Heading level={1}>About</Heading>
          <Text color="secondary">
            The technical docs are at <code>/imitations</code>, <code>/synthetics</code>, <code>/opinions</code>, and <code>/orders</code> — this page is about why Rebar exists at
            all.
          </Text>
        </Stack>
        <Stack gap="sm">
          <Heading level={2}>Explore</Heading>
          <Stack gap="xs">
            <Link href="/about/agent">Agent Context</Link>
            <Link href="/about/benchmarks">Benchmarks</Link>
          </Stack>
        </Stack>
        <NextBlockRenderer blocks={BLOCKS} />
      </Stack>
    </Box>
  );
}
