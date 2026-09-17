import { Box, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const DEMO_BLOCKS: Construct[] = [
  {
    type: "mega-menu",
    columns: [
      {
        heading: "Framework",
        items: [
          { label: "Orders", description: "Pick your Plenum", href: "/orders" },
          { label: "Archetypes", description: "Construct studies", href: "/archetypes" },
          { label: "Imitations", description: "Primitive Constructs", href: "/imitations" },
        ],
      },
      {
        heading: "",
        items: [
          { label: "Synthetics", description: "Complex Constructs", href: "/synthetics" },
          { label: "Opinions", description: "Dynamic Constructs", href: "/opinions" },
          { label: "Geneses", description: "Rebar alive", href: "/geneses" },
        ],
      },
      {
        heading: "Philosophy",
        items: [
          { label: "Heuristics", href: "/heuristics" },
          { label: "Roadmap", href: "/planned/_none" },
          { label: "Rules", href: "/about/agent" },
          { label: "Benchmarks", href: "/about/benchmarks" },
          { label: "About", href: "/about" },
        ],
      },
    ],
    footer: { label: "Go to the GitHub Repo", href: "https://github.com/ob27/rebarui" },
  },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `{
  type: "mega-menu",
  columns: [
    {
      heading: "Framework",
      items: [
        { label: "Orders", description: "Pick your Plenum", href: "/orders" },
        { label: "Archetypes", description: "Construct studies", href: "/archetypes" },
      ],
    },
    // ...more columns
  ],
  footer: { label: "Go to the GitHub Repo", href: "https://github.com/..." },
}`,
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [
      {
        kind: "code",
        code: `{
  type: "mega-menu",
  columns: {
    heading: string,
    items: { label: string; description?: string; href: string; icon?: IconName; external?: boolean }[],
  }[],
  footer?: { label: string; href: string },
}`,
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Usage",
    body: [
      {
        kind: "text",
        text: "MegaMenu is a multi-column navigation panel — typically rendered inside a Popover triggered from a NavBar item. Each column has an optional heading and a list of items (label + optional description + href). An optional footer link spans the full width at the bottom.",
      },
      {
        kind: "text",
        text: "The mega-menu has no chrome of its own — no border, background, or shadow on the popover container. The panel inside draws its own subtle shadow and rounded corners, so it floats cleanly above the page without a double-border effect.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Dismissal",
    body: [
      {
        kind: "text",
        text: "Clicking any link inside the mega-menu closes the popover. The trigger button uses controlled open state — `open`/`onOpenChange` — so the host component (usually NavBar) owns the open lifecycle.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-placement-block="mega-menu"` on the panel root, `data-rebar-part="mega-trigger"` on the trigger button.',
      },
    ],
  },
];

export default function MegaMenuPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>MegaMenu</Heading>
      <Text color="secondary">
        A multi-column navigation panel for dense site maps — renders inside a Popover with no
        container chrome of its own. The panel draws its own subtle shadow and rounded corners.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
          backgroundColor: "var(--rebar-color-bg-secondary, #f5f5f5)",
        }}
      >
        <NextBlockRenderer blocks={DEMO_BLOCKS} />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
