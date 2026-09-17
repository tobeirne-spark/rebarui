"use client";

import { useState } from "react";
import {
  Box,
  ChatIcon,
  DashboardIcon,
  ErrorWarningIcon,
  FolderIcon,
  Heading,
  HomeIcon,
  LineChartIcon,
  SettingsIcon,
  Stack,
  TaskIcon,
  TeamIcon,
  Text,
  AppShell,
} from "rebar-ui";
import type { SidebarNavProps } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SIDEBAR_ITEMS: SidebarNavProps["items"] = [
  { label: "Dashboard", href: "#dashboard", icon: <DashboardIcon />, active: true },
  { label: "Overview", href: "#overview", icon: <LineChartIcon /> },
  { label: "Chat", href: "#chat", icon: <ChatIcon />, badge: "5" },
  { label: "Team", href: "#team", icon: <TeamIcon /> },
  { type: "heading", label: "Shortcuts" },
  { label: "Tasks", href: "#tasks", icon: <TaskIcon /> },
  { label: "Reports", href: "#reports", icon: <ErrorWarningIcon /> },
  { type: "divider" },
  { label: "Settings", href: "#settings", icon: <SettingsIcon /> },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<AppShell
  sidebar={{
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon />, active: true },
      { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
    ],
    header: <Heading level={3}>My App</Heading>,
  }}
>
  <BlockRenderer document={myBlocks} />
</AppShell>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["AppShell"] ?? [] },
  {
    type: "doc-section",
    heading: "Starter template: AppShell + BlockRenderer",
    body: [
      {
        kind: "text",
        text: "The expected architecture for a full-viewport application: `AppShell` provides the structural frame (sidebar or top-nav + content area), and `BlockRenderer` prints declarative content within that frame. This separation keeps layout concerns (the shell) distinct from content concerns (the blocks), and makes it impossible to hand-roll or hand-draw the shell — you select an order-tier component first, then compose content inside it.",
      },
      {
        kind: "code",
        code: `// app/page.tsx
import { AppShell, Heading, Text } from "rebar-ui";
import { BlockRenderer } from "@rebar-ui/placement";
import type { Construct } from "@rebar-ui/placement";

const DASHBOARD_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Welcome",
    body: [{ kind: "text", text: "This is your dashboard." }],
  },
  // ... more blocks
];

export default function DashboardPage() {
  return (
    <AppShell
      sidebar={{
        items: [
          { label: "Dashboard", href: "/", icon: <DashboardIcon />, active: true },
          { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
        ],
        header: <Heading level={3}>My App</Heading>,
      }}
    >
      <BlockRenderer document={DASHBOARD_BLOCKS} />
    </AppShell>
  );
}`,
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Why this architecture",
    body: [
      {
        kind: "text",
        text: "`AppShell` solves the CSS height-inheritance problem — the common bug where a sidebar doesn't extend to the bottom of the viewport because `height: 100%` on a child only works when the parent has an explicit `height` (not just `minHeight`). `AppShell` uses `height: 100vh` on the outer container, ensuring all children with `height: 100%` resolve correctly. You don't have to reason about CSS height constraints yourself.",
      },
      {
        kind: "text",
        text: "`BlockRenderer` prints declarative content from a `Construct[]` document — the same document can be rendered by different block renderers (web, mobile, diagram), and the content is data, not JSX. This makes it easy to swap content without touching layout, or to generate content programmatically.",
      },
      {
        kind: "text",
        text: "Together, they enforce the Fast & Simple principle: select an order first (`AppShell`), then use the block renderer to print content within that order. Don't hand-roll or hand-draw the shell — that's what order-tier components are for.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Variants",
    body: [
      {
        kind: "text",
        text: "`AppShell` has three variants: `sidebar` (dashboard pattern, sidebar on left + content on right), `top-nav` (documentation/marketing pattern, nav on top + content below), and `bare` (no nav, just a full-viewport container). Pick one layout variant, not both — `sidebar` and `topNav` are mutually exclusive props.",
      },
      {
        kind: "code",
        code: `// Sidebar variant (dashboard)
<AppShell sidebar={{ items: [...] }}>
  <BlockRenderer document={blocks} />
</AppShell>

// Top-nav variant (docs/marketing)
<AppShell variant="top-nav" topNav={{ items: [...] }}>
  <BlockRenderer document={blocks} />
</AppShell>

// Bare variant (no nav, just full-viewport container)
<AppShell variant="bare">
  <BlockRenderer document={blocks} />
</AppShell>`,
      },
    ],
  },
  {
    type: "doc-section",
    heading: "When NOT to use AppShell",
    body: [
      {
        kind: "text",
        text: "Don't use `AppShell` for embedded widgets that don't own the full viewport — use a plain `<Stack>` or `<Box>` instead. Don't use it for pages that scroll naturally — `AppShell` is for full-viewport applications where the sidebar/top-nav must extend to the viewport edge. If you're embedding a widget inside another page, you probably want a plain `<Stack>` with `height: \"auto\"` instead.",
      },
    ],
  },
];

export default function AppShellPage() {
  const [variant, setVariant] = useState<"sidebar" | "top-nav">("sidebar");

  return (
    <Stack gap="lg">
      <Heading level={1}>AppShell</Heading>
      <Text>
        A full-viewport application shell that handles CSS height inheritance correctly — the common
        layout bug where a sidebar doesn't extend to the bottom because its <code>height: 100%</code>{" "}
        doesn't resolve without an explicit parent height is impossible here, because this component
        uses <code>height: 100vh</code> (not <code>minHeight</code>) on the outer container.
      </Text>

      <Box style={{ border: "1px solid var(--rebar-color-border)", padding: "var(--rebar-space-md)" }}>
        <Stack gap="md">
          <Heading level={3}>Live preview</Heading>
          <Stack direction="row" gap="sm">
            <button onClick={() => setVariant("sidebar")} disabled={variant === "sidebar"}>
              Sidebar variant
            </button>
            <button onClick={() => setVariant("top-nav")} disabled={variant === "top-nav"}>
              Top-nav variant
            </button>
          </Stack>
          <Box
            style={{
              height: 400,
              border: "1px solid var(--rebar-color-border)",
              overflow: "hidden",
            }}
          >
            <AppShell
              variant={variant}
              height="400px"
              sidebar={
                variant === "sidebar"
                  ? {
                      items: SIDEBAR_ITEMS,
                      header: <Heading level={3}>My App</Heading>,
                    }
                  : undefined
              }
              topNav={
                variant === "top-nav"
                  ? {
                      items: [
                        { label: "Home", href: "#home" },
                        { label: "Docs", href: "#docs" },
                        { label: "About", href: "#about" },
                      ],
                    }
                  : undefined
              }
            >
              <Box style={{ padding: "var(--rebar-space-lg)" }}>
                <Heading level={2}>Content area</Heading>
                <Text>
                  This is where your page content goes. The content area fills the remaining space
                  after the sidebar/top-nav, and scrolls independently if the content overflows.
                </Text>
              </Box>
            </AppShell>
          </Box>
        </Stack>
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
