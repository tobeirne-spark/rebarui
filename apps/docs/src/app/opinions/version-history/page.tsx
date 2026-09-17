"use client";

import { Button, Heading, Stack, Text, VersionHistory } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const VERSIONS = [
  { id: "v3", label: "Auto-saved", timestamp: new Date(), preview: "Final edits before publishing the draft." },
  { id: "v2", label: "Before AI edit", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), preview: "Original paragraph before the assistant rewrote it." },
  { id: "v1", label: "First draft", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), preview: "Initial outline and opening paragraph." },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<VersionHistory\n  trigger={<Button>Version history</Button>}\n  versions={versions}\n  currentVersionId="v3"\n  onRestore={(v) => restore(v.id)}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["VersionHistory"] ?? [] },
  {
    type: "doc-section",
    heading: "Pure composition",
    body: [
      {
        kind: "text",
        text: 'Built entirely from existing components — the internal `DrawerPanel` for the slide-in chrome (same plumbing `BottomSheet`/`ActionSheet` share), the real `Popconfirm` for the restore confirmation step (never restores on the first click), and `Tag` for the "Current" pill per heuristic #41.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="version-history"`; rows carry `data-rebar-part="row" | "label" | "timestamp" | "preview" | "restore-button"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Drawer` + `List` + `Popconfirm` directly; the shape maps across almost verbatim.",
      },
    ],
  },
];

export default function VersionHistoryPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>VersionHistory</Heading>
      <Text color="secondary">
        A drawer listing timestamped content snapshots with a confirm-before-restore action per row.
      </Text>

      <VersionHistory
        trigger={<Button>Version history</Button>}
        versions={VERSIONS}
        currentVersionId="v3"
        onRestore={() => {}}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
