import { Footer, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Footer\n  label="No more results"\n  content="© 2026 Example Inc."\n  links={[{ text: "Terms", href: "/terms" }, { text: "Privacy", href: "/privacy" }]}\n  chips={[{ text: "New" }, { text: "Feedback", type: "link" }]}\n  onChipClick={(item) => console.log(item)}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Footer"] ?? [] },
  {
    type: "doc-section",
    heading: "Every section is independently optional",
    body: [
      {
        kind: "text",
        text: "`label` renders as a real `Divider` with text (e.g. \"No more results\"); `content` is a plain line below it (e.g. copyright); `links` renders real `<a>` elements (pass `renderLink` for client-side routing, same convention as `NavBar`/`SidebarNav`); `chips` renders plain, non-interactive `Tag`s by default, or real focusable buttons for `type: \"link\"` chips.",
      },
      {
        kind: "text",
        text: "`onLinkClick`, when set, calls `event.preventDefault()` first — the same \"intercept the jump\" behavior antd-mobile's own `Footer` documents — so the caller decides what happens instead of a real page navigation firing.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="footer"`; `data-rebar-part="label"|"content"|"links"|"chips"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Ant Design (web) has no direct equivalent — this ports antd-**mobile**'s `Footer` shape, since nothing in the web-focused antd component set covers page-bottom chrome. A migration typically composes `Divider` + plain links + `Tag`.",
      },
    ],
  },
];

export default function FooterPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Footer</Heading>
      <Text color="secondary">
        Page-bottom chrome: an optional &quot;no more content&quot; label, a plain content line, a
        row of links, and a row of chips — every section independently optional.
      </Text>

      <LivePreview>
        <Footer
          label="No more results"
          content="© 2026 Example Inc."
          links={[
            { text: "Terms", href: "#terms" },
            { text: "Privacy", href: "#privacy" },
          ]}
          chips={[{ text: "New" }, { text: "Feedback", type: "link" }]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
