import { Breadcrumb, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Breadcrumb\n  items={[\n    { label: "Home", href: "/" },\n    { label: "Projects", href: "/projects" },\n    { label: "Marketing Site Redesign" },\n  ]}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Breadcrumb"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`<nav aria-label="Breadcrumb">` wrapping a real `<ol>` — each non-final item with an `href` is a real `<a>`; the final item is plain text marked `aria-current="page"`, never a link to the page already being viewed. Separators are `aria-hidden`, since they carry no information a screen reader needs.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="breadcrumb"`, `data-rebar-part="item" | "separator"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Breadcrumb` takes an `items` array with the same `title`/`href`-equivalent shape (AntD calls it `title`, not `label`) — a close, mostly mechanical rename, not yet codemod-covered.",
      },
    ],
  },
];

export default function BreadcrumbPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Breadcrumb</Heading>
      <Text color="secondary">
        A real <code>&lt;nav&gt;</code> landmark over an ordered list of links, ending in the
        current page. The last item is never a link — it&apos;s marked{" "}
        <code>aria-current=&quot;page&quot;</code> instead.
      </Text>

      <LivePreview>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Projects", href: "/projects" },
            { label: "Marketing Site Redesign" },
          ]}
        />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
