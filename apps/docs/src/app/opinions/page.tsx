import { Heading, Image, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { HAS_FULL_PAGE } from "@/data/hasFullPage";
import { shippedCategory } from "@/data/shippedCategory";
import { tierComponentNames } from "@/data/tierSections";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const CATEGORY_LABEL = { web: "Web", mobile: "Mobile", diagram: "Diagram" } as const;
const CATEGORY_TONE = { web: "info", mobile: "success", diagram: "warning" } as const;

export default function OpinionsPage() {
  const names = tierComponentNames("opinion");

  const grid: Construct = {
    type: "card-grid",
    items: [
      ...names.map((name) => {
        const href = HAS_FULL_PAGE[name];
        const category = shippedCategory(name);
        return { title: name, href, linkLabel: "View reference →", tags: [{ label: CATEGORY_LABEL[category], tone: CATEGORY_TONE[category] }] };
      }),
      // The one genuine "rolled up" case (see /about/agent): Card's default config is a Synthetic
      // (see /synthetics), but `editable` grafts real click-to-edit state via Editable — an
      // Opinion. Same physical component/page, cross-linked here rather than duplicated as a
      // second export.
      {
        title: "Card (editable)",
        href: "/synthetics/card",
        linkLabel: "View reference →",
        tags: [{ label: "See Synthetics for the default config", tone: "info" as const }],
      },
    ],
  };

  return (
    <Stack gap="lg">
      <Image src="/catalogue-heros/opinions.jpeg" alt="Opinions hero image" style={{ width: "100%", borderRadius: "8px" }} />
      <Heading level={1}>Opinions</Heading>
      <Text color="secondary">
        Real internal state — validation, morphing, multi-step flow, drag/reorder,
        search-and-filter, open/closed with focus management. Several components delegate their
        entire state machine to a wrapped Radix primitive (Select, Accordion, Tabs, Dialog,
        Popover, …) and show zero own useState in their own source — they&apos;re still Opinions;
        you can&apos;t determine tier by grepping for state alone. For blocks, Opinion is a
        mechanical, compiler-checked fact: a block is an Opinion iff its schema type declares a{" "}
        <code>source</code> or <code>onX</code> live-data-binding field (
        <code>packages/placement/src/opinions.ts</code>), not a judgment call — these are the only
        nine blocks that support the live <code>data</code>/<code>handlers</code> props on{" "}
        <code>BlockRenderer</code>. See{" "}
        <a href="/about/agent" className="rebar-link">
          the four tiers
        </a>{" "}
        for how this relates to Imitations, Synthetics, and Orders.
      </Text>

      <Heading level={2}>Components ({names.length})</Heading>
      <NextBlockRenderer blocks={[grid]} />
    </Stack>
  );
}
