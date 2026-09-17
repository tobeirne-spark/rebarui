import { Heading, Stack, Text, ThemeToggle } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<ThemeToggle label="Theme" />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ThemeToggle"] ?? [] },
  {
    type: "doc-section",
    heading: "The same real switch this site's own DevTools panel uses",
    body: [
      {
        kind: "text",
        text: 'A visitor-facing popover onto the exact same DOM attributes this site\'s own dev-only DevTools panel already writes (`data-rebar-theme="sketch"|"clean"`, `data-theme="dark"`/absent, `data-rebar-bionic="true"`/absent) — not a second, competing mechanism. This is a real, shipped component, not private page chrome, so any site built on rebar-ui can offer visitors the same control — the "Theme" button in this site\'s own top-right corner is this exact component.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: 'None on the toggle itself — it reads/writes `data-rebar-theme`/`data-theme`/`data-rebar-bionic` on the document root, the same attributes `RebarDevTools` uses.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "Not codemod-covered — AntD has no equivalent built-in theme-switch component; its own theming runs through `ConfigProvider`'s token system instead." },
    ],
  },
];

export default function ThemeTogglePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>ThemeToggle</Heading>
      <Text color="secondary">
        A visitor-facing theme switch — the same real component this site&apos;s own
        &quot;Theme&quot; button in the top-right corner is.
      </Text>

      <LivePreview>
        <ThemeToggle />
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
