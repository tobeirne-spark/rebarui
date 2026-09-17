import { Box, Heading, MobileTabBar, Stack, Text } from "rebar-ui";
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
        code: `<MobileTabBar\n  items={[\n    { label: "Home" },\n    { label: "Search" },\n    { label: "Saved" },\n    { label: "Profile" },\n  ]}\n  defaultActiveIndex={0}\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["MobileTabBar"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'Not a modal — a plain `<nav aria-label="Primary">` of real, keyboard-focusable `<button>` or `<a>` targets (via the `renderLink` escape hatch, same convention `NavBar` and `@rebar-ui/placement`\'s own `renderLink` use for a framework router). Every item is at least 44×44 CSS px (ref/HEURISTICS.md #19) and always shows both an icon and a label — never icon-only (#13). The active item carries `aria-current="page"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="mobile-tab-bar"` on the `<nav>`; `data-rebar-part="item"` on each item wrapper.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD (the web-focused library) has no direct equivalent — a bottom app-level tab bar is a mobile-native pattern (Cupertino's `TabBar`, Ionic's `IonTabBar`, Flutter's `BottomNavigationBar`), not part of antd proper. antd-mobile's own `TabBar` is the closer sibling library if a migration target is genuinely mobile.",
      },
    ],
  },
];

export default function MobileTabBarPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>MobileTabBar</Heading>
      <Text color="secondary">
        A bottom-fixed, app-level primary navigation bar — icon-over-label items, always visible,
        no open/close state. Structurally closer to <code>NavBar</code> than to a modal.
      </Text>

      <LivePreview>
        {/* MobileTabBar is position: fixed to its containing block's bottom edge — the transform
            below gives this demo box its own containing block (per the CSS spec, a transformed
            ancestor becomes the containing block for a fixed-position descendant), so the bar
            anchors to the bottom of this bounded preview instead of escaping to the real
            browser viewport. */}
        <Box style={{ position: "relative", height: 180, transform: "translateZ(0)", overflow: "hidden" }}>
          <Text size="sm" color="secondary" style={{ padding: "var(--rebar-space-md)" }}>
            Page content would scroll here, above the fixed tab bar.
          </Text>
          <MobileTabBar
            items={[
              { label: "Home" },
              { label: "Search" },
              { label: "Saved" },
              { label: "Profile" },
            ]}
            defaultActiveIndex={0}
          />
        </Box>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
