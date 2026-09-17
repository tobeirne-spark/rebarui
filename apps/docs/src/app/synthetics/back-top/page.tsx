"use client";

import { useRef } from "react";
import { BackTop, Box, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<BackTop visibilityThreshold={300} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["BackTop"] ?? [] },
  {
    type: "doc-section",
    heading: "target is a real, accepted function-prop exception",
    body: [
      {
        kind: "text",
        text: '`target?: () => HTMLElement | Window` (default `() => window`) is a deliberate exception to this project\'s usual "avoid function props" guidance — there\'s no serializable way to reference "the window" or an arbitrary scroll container otherwise, the same call `Tour`\'s own `target` field makes.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Respects prefers-reduced-motion",
    body: [
      {
        kind: "text",
        text: 'Scrolling back to the top uses real smooth scroll (`scrollTo({ behavior: "smooth" })`) unless the visitor has `prefers-reduced-motion` set, in which case it jumps instantly instead — checked directly via `matchMedia`, not assumed.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="back-top"` on the button.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `BackTop` is a close direct equivalent — `visibilityThreshold`/`target`/`onClick` map directly across.",
      },
    ],
  },
];

export default function BackTopPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>BackTop</Heading>
      <Text color="secondary">
        A floating button that appears after scrolling down, jumping back to the top.
      </Text>

      <Box
        ref={scrollRef}
        style={{
          height: 200,
          overflowY: "auto",
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-md)",
          position: "relative",
        }}
      >
        <Stack gap="sm">
          {Array.from({ length: 20 }, (_, i) => (
            <Text key={i} size="sm">
              Scroll content, row {i + 1}
            </Text>
          ))}
        </Stack>
        <BackTop visibilityThreshold={80} target={() => scrollRef.current ?? window} />
      </Box>
      <Text size="xs" color="secondary">
        Scroll the box above — the button appears once you&apos;ve scrolled past ~80px.{" "}
        <strong>It appears fixed to the real browser viewport&apos;s bottom-right corner, not
        anchored inside this small demo box</strong> — `target` only controls which element&apos;s
        scroll position is tracked and scrolled back to, not where the button itself is drawn
        (it&apos;s always `position: fixed` to the page). In a real full-page use, that&apos;s
        exactly the point; in this cropped demo it can read as the button appearing somewhere
        unexpected rather than inside the box you just scrolled.
      </Text>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
