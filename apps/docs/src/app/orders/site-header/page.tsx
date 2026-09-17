import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A real site nav bar: logo (optionally linked, optionally with an icon image), a nav-bar capped at half the header's own width per the 'Nav overflow' heuristic (the logo and trailing content always keep guaranteed room), and optional trailing content pushed to the far edge — plain text (a version string), a login action, or a signed-in user's avatar. This project's own site header (above) is exactly this block, not hand-authored — see it at real scale there." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "site-header", logo: { label: string, href?: string, iconSrc?: string }, items: { label: string, href: string }[], ariaLabel?: string, trailing?: { kind: "text", text: string } | { kind: "login", label?: string, href?: string } | { kind: "avatar", name: string, avatarSrc?: string, href?: string, placeholder?: boolean } }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the site-header block:" }],
  },
  {
      type: "site-header",
      logo: {
        label: "Acme",
        href: "#",
      },
      items: [
        {
          label: "Docs",
          href: "#",
        },
        {
          label: "Pricing",
          href: "#",
        },
      ],
      trailing: {
        kind: "avatar",
        name: "Jane Doe",
        href: "#",
        placeholder: true,
      },
    },
];

export default function SiteHeaderPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Site Header</Heading>
      <Text color="secondary">{"A real site nav bar: logo (optionally linked, optionally with an icon image), a nav-bar capped at half the header's own width per the 'Nav overflow' heuristic (the logo and trailing content always keep guaranteed room), and optional trailing content pushed to the far edge — plain text (a version string), a login action, or a signed-in user's avatar. This project's own site header (above) is exactly this block, not hand-authored — see it at real scale there."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
