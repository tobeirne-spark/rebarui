"use client";

import { useState } from "react";
import { Button, Heading, NoticeBar, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// rebar-ui's icon set (packages/core/src/components/icons.tsx) is an internal implementation
// detail, not part of the public API — a consuming app supplies its own icon, the same
// recommendation packages/core/README.md gives for exactly this case.
function WarningIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 15V17H13V15H11ZM11 7V13H13V7H11Z" />
    </svg>
  );
}

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<NoticeBar tone="warning" icon={<WarningIcon />} content="Scheduled maintenance begins in 10 minutes." closable onClose={dismiss} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["NoticeBar"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from Alert and Toast",
    body: [
      {
        kind: "text",
        text: "`Alert` is a boxed message inline in content; `Toast` is an ephemeral overlay that clears itself. `NoticeBar` sits pinned at the top of a view and stays until dismissed or the underlying condition clears — a maintenance notice, a stale-data warning, an offline banner. Single-line content too long to fit auto-scrolls as a marquee, measured against the real rendered width (not guessed from character count); pass `wrap` for static multi-line content instead.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="notice-bar"` with `data-rebar-tone` set to the current tone; parts: `icon`, `content`, `text` (the actual scrolling/static text node), `action`, `close`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — this is the antd-mobile `NoticeBar` pattern. AntD desktop has no direct equivalent; closest is a full-width `Alert` with `banner` styling.",
      },
    ],
  },
];

export default function NoticeBarPage() {
  const [visible, setVisible] = useState(true);

  return (
    <Stack gap="lg">
      <Heading level={1}>NoticeBar</Heading>
      <Text color="secondary">
        A persistent, full-width announcement strip — pinned at the top of a view until dismissed,
        with an auto-scrolling marquee for single-line content too long to fit.
      </Text>

      <LivePreview>
        <Stack gap="md">
          {visible ? (
            <NoticeBar
              tone="warning"
              icon={<WarningIcon />}
              content="Scheduled maintenance begins in 10 minutes — save your work before then."
              closable
              onClose={() => setVisible(false)}
            />
          ) : (
            <Button onClick={() => setVisible(true)}>Show notice again</Button>
          )}
          <NoticeBar tone="info" content="Wrapped, multi-line content stays static instead of scrolling." wrap />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
