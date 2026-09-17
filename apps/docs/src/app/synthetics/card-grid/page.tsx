import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A wrapping grid of cards — title, optional body copy, optional status tags, optional link — for an index/directory of many similar named things (see the /components page, rebuilt through this block). Distinct from feature-grid (no link, no tags, meant for a handful of short callouts) and pillar-grid (a fixed small set with a mandatory CTA): card-grid is for an open-ended, possibly large list where each item may or may not have a description, a link, or a status yet — see \"Design Heuristics\" #41 (status is a pill, not label text) and #12 (every card needs its own title/content/action zones, not just a title)." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "card-grid", items: { title: string, body?: string, href?: string, linkLabel?: string, tags?: { label: string, tone?: Tone }[] }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the card-grid block:" }],
  },
  {
      type: "card-grid",
      items: [
        {
          title: "Avatar",
          body: "Illustrated placeholder art.",
          href: "#",
          linkLabel: "View reference →",
        },
        {
          title: "Accordion",
          tags: [
            {
              label: "No reference page",
              tone: "warning",
            },
          ],
        },
        {
          title: "DatePicker",
          body: "Calendar popup for picking dates.",
          href: "#",
          linkLabel: "View reference →",
          tags: [
            {
              label: "Mobile only",
              tone: "info",
            },
          ],
        },
      ],
    },
];

export default function CardGridPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Card Grid</Heading>
      <Text color="secondary">{"A wrapping grid of cards — title, optional body copy, optional status tags, optional link — for an index/directory of many similar named things (see the /components page, rebuilt through this block). Distinct from feature-grid (no link, no tags, meant for a handful of short callouts) and pillar-grid (a fixed small set with a mandatory CTA): card-grid is for an open-ended, possibly large list where each item may or may not have a description, a link, or a status yet — see \"Design Heuristics\" #41 (status is a pill, not label text) and #12 (every card needs its own title/content/action zones, not just a title)."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
