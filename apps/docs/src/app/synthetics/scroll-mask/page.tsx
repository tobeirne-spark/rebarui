"use client";

import { useRef } from "react";
import { Heading, ScrollMask, Stack, Text } from "rebar-ui";
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
        code: 'const scrollRef = useRef<HTMLDivElement>(null);\n\n<div style={{ position: "relative" }}>\n  <ScrollMask scrollTrackRef={scrollRef} />\n  <div ref={scrollRef} style={{ overflowX: "auto", whiteSpace: "nowrap" }}>\n    {/* long row of content */}\n  </div>\n</div>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ScrollMask"] ?? [] },
  {
    type: "doc-section",
    heading: "Real scroll position, not a guess",
    body: [
      {
        kind: "text",
        text: "Both edge masks show and hide based on the tracked element's actual `scrollLeft`/`scrollWidth` — a scroll listener plus a `ResizeObserver` and `MutationObserver` on the tracked element, so it stays correct through both resizing and content changes (e.g. a chip added to a fixed-width row). `ScrollMask` renders as a sibling of the scrollable element, inside a shared `position: relative` wrapper — the same layout antd-mobile's own version uses — and is entirely `pointer-events: none`/`aria-hidden`, so it never blocks interacting with the real content underneath.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="scroll-mask"`; `data-rebar-part="start"|"end"`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Ant Design (web) has no direct equivalent — this ports antd-**mobile**'s `ScrollMask`. A migration typically hand-rolls the same scroll-listener-plus-gradient-overlay pattern, or drops the affordance entirely if the design doesn't need it.",
      },
    ],
  },
];

export default function ScrollMaskPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>ScrollMask</Heading>
      <Text color="secondary">
        Edge-fade gradient overlays hinting that a horizontally-scrollable row has more content
        past what&apos;s visible.
      </Text>

      <LivePreview>
        <div style={{ position: "relative", maxWidth: 320 }}>
          <ScrollMask scrollTrackRef={scrollRef} />
          <div
            ref={scrollRef}
            style={{ overflowX: "auto", whiteSpace: "nowrap", padding: "var(--rebar-space-sm) 0" }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  padding: "var(--rebar-space-sm) var(--rebar-space-md)",
                  marginRight: "var(--rebar-space-sm)",
                  border: "1px solid var(--rebar-color-border)",
                  borderRadius: 4,
                }}
              >
                Item {i + 1}
              </span>
            ))}
          </div>
        </div>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
