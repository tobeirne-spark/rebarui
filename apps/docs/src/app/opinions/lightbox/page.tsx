"use client";

import { useState } from "react";
import { Heading, Lightbox, Stack, Text } from "rebar-ui";
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
        code: '<Lightbox src="/photo-full.jpg" alt="A mountain lake at sunrise" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Lightbox"] ?? [] },
  {
    type: "doc-section",
    heading: "Built on Dialog, not reimplemented",
    body: [
      {
        kind: "text",
        text: 'Composes the real `Dialog` component directly with its `fullscreen` flag — no reimplemented modal/focus-trap logic, and `Dialog`\'s own close button is the only close button. Pinch-zoom/pan is deliberately out of scope, the same reasoning `BottomSheet`\'s drag handle used to skip real drag-to-dismiss physics: gesture physics (momentum, multi-touch scale/rotate) is a separate, harder problem than the "fullscreen preview + close" shape this component actually covers.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Action buttons",
    body: [
      {
        kind: "text",
        text: '`onCopy`/`onDelete`/`onMove`/`onDownload` each show their own icon button in the fullscreen footer, only when the corresponding callback is actually supplied — no separate boolean flag + callback pair. `moreActions` (an array of the same `DropdownItem` shape `Dropdown` itself uses) adds an overflow "more actions" button for anything that doesn\'t warrant its own dedicated icon, opening a real `Dropdown` menu rather than a bespoke one.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="lightbox"`; parts: `trigger`, `thumbnail`, `image`, `actions`. The fullscreen dialog itself carries `Dialog`\'s own attributes.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD bundles fullscreen preview directly into its own `Image` component (a `preview` prop) rather than as a separate component — a migration typically folds this into that prop instead of keeping a standalone lightbox.",
      },
    ],
  },
];

export default function LightboxPage() {
  const [lastAction, setLastAction] = useState("none yet");

  return (
    <Stack gap="lg">
      <Heading level={1}>Lightbox</Heading>
      <Text color="secondary">
        Click an image to open a fullscreen preview — built on <code>Dialog</code>'s{" "}
        <code>fullscreen</code> flag.
      </Text>

      <LivePreview>
        <Lightbox
          src="https://picsum.photos/id/29/1200/800"
          alt="A random full-size placeholder photo"
        />
      </LivePreview>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Last action fired: <strong>{lastAction}</strong>
        </Text>
        <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
          <Stack gap="xs">
            <Text size="sm" color="secondary">
              Full action set
            </Text>
            <Lightbox
              src="https://picsum.photos/id/48/1200/800"
              alt="A random full-size placeholder photo, second example"
              onCopy={() => setLastAction("copy")}
              onDownload={() => setLastAction("download")}
              onMove={() => setLastAction("move")}
              onDelete={() => setLastAction("delete")}
              moreActions={[{ key: "report", label: "Report image", onSelect: () => setLastAction("report") }]}
            />
          </Stack>
          <Stack gap="xs">
            <Text size="sm" color="secondary">
              Minimal set (copy + download only)
            </Text>
            <Lightbox
              src="https://picsum.photos/id/65/1200/800"
              alt="A random full-size placeholder photo, third example"
              onCopy={() => setLastAction("copy")}
              onDownload={() => setLastAction("download")}
            />
          </Stack>
          <Stack gap="xs">
            <Text size="sm" color="secondary">
              No actions (default)
            </Text>
            <Lightbox
              src="https://picsum.photos/id/76/1200/800"
              alt="A random full-size placeholder photo, fourth example"
            />
          </Stack>
        </Stack>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
