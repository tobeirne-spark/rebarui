import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "Page-bottom chrome: a 'no more results' label (a real Divider with text), a plain content line, a row of links, and a row of chips — every section independently optional. Mirrors how site-header already wraps NavBar for the top of a page; this project's second Mobile block (see ref/BLOCKS.md). No onLinkClick/onChipClick in the schema — a click handler isn't serializable Block[] data." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "footer", label?: string, content?: string, links?: { text: string, href: string }[], chips?: { text: string, type?: "plain"|"link" }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the footer block:" }],
  },
  {
      type: "footer",
      label: "No more results",
      content: "© 2026 Example Inc.",
      links: [
        {
          text: "Terms",
          href: "#",
        },
        {
          text: "Privacy",
          href: "#",
        },
      ],
      chips: [
        {
          text: "New",
        },
        {
          text: "Feedback",
          type: "link",
        },
      ],
    },
];

export default function FooterPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Footer</Heading>
      <Text color="secondary">{"Page-bottom chrome: a 'no more results' label (a real Divider with text), a plain content line, a row of links, and a row of chips — every section independently optional. Mirrors how site-header already wraps NavBar for the top of a page; this project's second Mobile block (see ref/BLOCKS.md). No onLinkClick/onChipClick in the schema — a click handler isn't serializable Block[] data."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
