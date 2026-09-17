import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A horizontal site nav that measures its own available width and collapses items that would push it past that width into a trailing \"More\" popover instead of wrapping or clipping — see the \"Nav overflow\" rule on Design Heuristics. Drag the demo box's own bottom-right corner to actually resize it live — resizable is off by default (a real site header should never be user-resizable); it's only on here to demonstrate the collapse." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "nav-bar", items: { label: string, href: string }[], ariaLabel?: string, resizable?: boolean }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the nav-bar block:" }],
  },
  {
      type: "nav-bar",
      ariaLabel: "Example",
      resizable: true,
      items: [
        {
          label: "Docs",
          href: "#",
        },
        {
          label: "Components",
          href: "#",
        },
        {
          label: "Blocks",
          href: "#",
        },
        {
          label: "Benchmarks",
          href: "#",
        },
        {
          label: "About",
          href: "#",
        },
      ],
    },
];

export default function NavBarPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Nav Bar</Heading>
      <Text color="secondary">{"A horizontal site nav that measures its own available width and collapses items that would push it past that width into a trailing \"More\" popover instead of wrapping or clipping — see the \"Nav overflow\" rule on Design Heuristics. Drag the demo box's own bottom-right corner to actually resize it live — resizable is off by default (a real site header should never be user-resizable); it's only on here to demonstrate the collapse."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
