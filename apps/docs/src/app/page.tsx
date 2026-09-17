import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Box, Button, Card, CodeBlock, Heading, Stack, Text } from "rebar-ui";
import type { Construct, FeatureGridItem, PillarGridItem } from "@rebar-ui/placement";
import { ComparisonDemo } from "@/components/ComparisonDemo";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// This homepage is itself built through the placement layer (the "RebarUI DSL Packer"), not
// hand-authored Rebar components — the hero, both section headers, the feature row, the
// three-pillars grid, the migration comparison (a `comparison` block, both sides real: the Rebar
// side rendered live, the antd side a real separate build embedded via an `iframe` block), and the
// "get started" section below are all `BlockRenderer` output from plain Construct[] documents, the same
// mechanism /benchmarks measures and /about/agent explains. Proof-by-existence, per
// ref/MARKETING_SITE.md: this site really is built the way it says Rebar is meant to be used, not
// just described that way. `Section` (page-chrome padding/background) is the one thing the Packer
// itself is built from and stays hand-authored; `ComparisonDemo` isn't hand-drawn content either —
// it's a thin client wrapper that keeps the comparison's iframe src in sync with the ambient theme
// toggle, then hands the resulting `Construct[]` straight to the Packer like everything else here.

const HERO_BLOCKS: Construct[] = [
  {
    type: "hero",
    badge: "🚧 0.10.0 — see [the repo](https://github.com/ob27/rebarui)",
    title: "Rebar UI",
    subtitle:
      "Headless-first, intentionally low-fidelity React components, built to be built with by an LLM through a small placement layer — not hand-authored. Measured cheaper, faster, and more consistent than hand-authored Ant Design on a single build — and once a design goes through 15+ rounds of revision, still cheaper overall even after fully migrating to a real design system for production.",
    actions: [
      { label: "Agent Context", href: "/about/agent", variant: "primary" },
      { label: "Design Heuristics", href: "/about/agent" },
    ],
    codeSnippet: "npm install rebar-ui",
  },
];

const MICRO_FEATURES: FeatureGridItem[] = [
  {
    title: "Headless & accessible",
    body: "Radix UI underneath every interactive component.",
  },
  {
    title: "Built to be replaced",
    body: "CSS-variable theming — re-skin without rewriting.",
  },
  {
    title: "Playwright-proof",
    body: "data-rebar-* attributes survive the re-skin.",
  },
];

const THEME_SECTION_HEADER: Construct[] = [
  {
    type: "section-header",
    kicker: "The migration path",
    title: "Build in Rebar, migrate when it's time to theme for real",
    subtitle:
      "The exact same Composite-tier spec from /benchmarks — a filterable project list with a New Project modal — rendered live on the left, and the real, measured build after migrating away to Ant Design on the right.",
  },
];

const COMPOSITE_DEMO_BLOCKS: Construct[] = [
  {
    type: "filter-bar",
    searchPlaceholder: "Search projects…",
    filterLabel: "Status",
    filterOptions: ["All", "Active", "Archived"],
    actionLabel: "New Project",
  },
  {
    type: "data-list",
    items: [
      { title: "Marketing Site Redesign", badge: "Active" },
      { title: "Q3 Budget Review", badge: "Active" },
      { title: "Legacy API Migration", badge: "Archived" },
      { title: "Customer Portal Beta", badge: "Active" },
    ],
  },
  // The full Composite-tier spec also has a "New Project" modal — deliberately left out of this
  // live demo. The `modal` block always renders forced-open (see /about/agent#control for
  // why), which is correct for a benchmark scaffold that's the whole page, but would cover this
  // entire homepage as a fixed overlay here. The antd screenshot on the right still shows it —
  // that's a real difference between "a live demo embedded in a bigger page" and "the whole spec."
];

const PILLARS_HEADER: Construct[] = [
  {
    type: "section-header",
    kicker: "Three pillars",
    title: "Heuristics, components, and proof",
    subtitle:
      "The design defaults, the library that implements them, and the argument that building this way actually saves time and tokens.",
  },
];

const PILLARS: PillarGridItem[] = [
  {
    title: "Design Heuristics",
    body: "Spacing, type scale, color, and interaction defaults baked in — cited to Nielsen, Shneiderman, Material, Carbon, and USWDS, not invented. See each rule applied live by the DSL Packer.",
    href: "/about/agent",
    cta: "Read the heuristics",
  },
  {
    title: "Four Tiers",
    body: "166 components and 39 blocks, classified by where they sit between a raw static primitive and a piece of page-level structural law — Imitations, Synthetics, Opinions, Orders. Working toward full Ant Design v6 parity, with a real codemod, not just a prompt.",
    href: "/about/agent",
    cta: "Browse the tiers",
  },
  {
    title: "Benchmarks",
    body: "The actual argument for building this way, measured: cheaper, faster, and far more visually consistent than hand-authored AntD on a single build — and cheaper overall even after migrating away for real theming, once a design goes through 15+ rounds of revision.",
    href: "/about/benchmarks",
    cta: "See the numbers",
  },
];

const containerStyle: CSSProperties = { maxWidth: 960, margin: "0 auto" };

function Section({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <Box
      style={{
        background:
          tone === "muted" ? "var(--rebar-color-bg-secondary, #f5f5f5)" : "var(--rebar-color-bg-primary, #ffffff)",
        padding: "var(--rebar-space-2xl) var(--rebar-space-xl)",
      }}
    >
      <Box style={containerStyle}>{children}</Box>
    </Box>
  );
}

export default function Home() {
  return (
    <>
      <Section>
        <Stack gap="lg" style={{ alignItems: "center" }}>
          <NextBlockRenderer blocks={HERO_BLOCKS} />
          <Box style={{ paddingTop: "var(--rebar-space-md)" }}>
            <NextBlockRenderer blocks={[{ type: "feature-grid", items: MICRO_FEATURES }]} />
          </Box>
        </Stack>
      </Section>

      <Section tone="muted">
        <Stack gap="xl">
          <NextBlockRenderer blocks={THEME_SECTION_HEADER} />
          <ComparisonDemo
            leftLabel="Rebar (live — toggle the theme via 🔧 DevTools)"
            leftBlocks={COMPOSITE_DEMO_BLOCKS}
            rightLabel="→ migrated to Ant Design (live — a real, separate build)"
            iframeSrc="/demos/antd-composite/index.html"
            iframeTitle="The same list view, built directly in Ant Design — a real, separately-built live app, not a screenshot"
          />
          <Text size="xs" color="secondary" style={{ textAlign: "center" }}>
            Both sides are genuinely live implementations, not a real one next to a screenshot: the
            left renders in this page directly from a ~15-line <code>Construct[]</code> document; the
            right is a real, separate Vite+antd build (see{" "}
            <code>apps/docs/scripts/build-antd-demo.sh</code>) embedded live in an iframe. Both
            intentionally show the base list view rather than the &quot;New Project&quot; modal
            from the full spec, so the comparison is of the same thing on both sides — see the
            modal itself, live and properly closable, on the{" "}
            <a href="/opinions/dialog" className="rebar-link">Dialog reference page</a>. Same underlying spec as the{" "}
            <a href="/about/benchmarks/tiers" className="rebar-link">Composite tier</a> benchmark.
          </Text>
        </Stack>
      </Section>

      <Section tone="muted">
        <Stack gap="xl">
          <NextBlockRenderer blocks={PILLARS_HEADER} />
          <NextBlockRenderer blocks={[{ type: "pillar-grid", items: PILLARS }]} />
        </Stack>
      </Section>

      <Section>
        <Card>
          <Stack gap="md">
            <Heading level={2}>Get started</Heading>
            <CodeBlock
              code={`npm install rebar-ui @rebar-ui/theme-sketch

import "rebar-ui/style.css";
import "@rebar-ui/theme-sketch/theme.css";
import { Button } from "rebar-ui";

<html data-rebar-theme="sketch">
  <Button variant="primary">Ship it</Button>
</html>`}
            />
            <Stack direction="row" gap="md">
              <Link href="/about">
                <Button variant="primary">Read the docs</Button>
              </Link>
              <Link href="/about/agent">
                <Button variant="secondary">Browse the tiers</Button>
              </Link>
            </Stack>
          </Stack>
        </Card>
      </Section>
    </>
  );
}
