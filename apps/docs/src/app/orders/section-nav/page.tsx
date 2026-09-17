import { Box, Heading, SectionNav, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// 40, not a smaller round number: the beacon *pointer* (#46) only ever appears once the rail's own
// link list overflows its own box, not just once the page overflows — a handful of single-line
// links never does that even on a tall viewport. This needs to be long enough to guarantee it,
// same real-world scale as /about/agent' 46 real entries, the page this behavior was built for.
const DEMO_SECTIONS = Array.from({ length: 40 }, (_, i) => ({
  id: `section-nav-demo-${i + 1}`,
  label: `Section ${i + 1}`,
}));

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<SectionNav sections={[{ id: "intro", label: "Introduction" }, { id: "usage", label: "Usage" }]} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SectionNav"] ?? [] },
  {
    type: "doc-section",
    heading: "Heuristics this component embodies",
    body: [
      {
        kind: "text",
        text: "The full sourced write-up for each of these lives in [Design Heuristics](/about/agent) — this is the compact version, meant to be checked against when touching this component or the `page-index` block that wraps it, not re-derived from the narrative each time.",
      },
      {
        kind: "list",
        items: [
          "#11 IA as pyramid — the search box only renders once the list passes 12 sections; a short list needs reading, not searching.",
          "#43 Scroll mist — the top/bottom edges fade when content overflows past them, tracking real scroll position, never rendered unconditionally.",
          "#44 Beacon — the rail auto-scrolls to keep the active section in view; a manual scroll of the rail itself wins for 5s before it recenters.",
          "#45 Bounded footprint — height is a real, dynamically-measured value (not a static CSS guess), so the rail never grows past its own slice of the viewport.",
          "#46 Beacon pointer + eased scroll — a small marker on the rail's right edge (a dot at rest, a bar while a scroll that could be moving the beacon is active) marks which edge an out-of-view beacon sits past; every follow/recenter scroll eases rather than snaps.",
        ],
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'A real `<nav aria-label="Section navigation">` with plain `<a href="#...">` links — arrow-key/Tab navigation and URL fragment behavior all come from the browser\'s own anchor handling, not reimplemented. The beacon pointer is `aria-hidden` — purely a sighted affordance; the same information is already carried by `data-rebar-active` on the real active link.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="section-nav"` on the root; `data-rebar-part` is `"search"`, `"scroll"`, `"list"`, `"item"`, `"empty"`, `"mist-top"`/`"mist-bottom"`, or `"beacon-pointer-top"`/`"beacon-pointer-bottom"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no direct equivalent — its `Anchor` component tracks scroll position and highlights the active link, but has none of the mist, beacon-follow, or pointer behavior above; a migration keeps `Anchor` for the base tracking and drops those refinements unless rebuilt by hand.",
      },
    ],
  },
];

export default function SectionNavPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>SectionNav</Heading>
      <Text color="secondary">
        An in-page content index — the right-hand counterpart to <code>NavIndex</code> (which
        indexes other pages; this indexes headings on the current one). The live example below is
        long enough to actually overflow — scroll the page to see the mist, the beacon follow, and
        (scroll the demo&apos;s own rail by hand, then keep scrolling the page) the beacon pointer.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="xl" style={{ alignItems: "flex-start" }}>
          <Stack gap="lg" style={{ flex: 1, minWidth: 0 }}>
            {DEMO_SECTIONS.map((section) => (
              <Box key={section.id} id={section.id} style={{ minHeight: 180 }}>
                <Heading level={2}>{section.label}</Heading>
                <Text color="secondary">
                  Placeholder content for {section.label.toLowerCase()}, tall enough that the full
                  list of {DEMO_SECTIONS.length} sections overflows both the page and the rail's own
                  box — the only way to honestly demonstrate mist, beacon-follow, and the beacon
                  pointer live rather than describe them.
                </Text>
              </Box>
            ))}
          </Stack>
          <SectionNav sections={DEMO_SECTIONS} />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
