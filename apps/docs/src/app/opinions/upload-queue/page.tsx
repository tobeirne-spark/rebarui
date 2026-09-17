"use client";

import { useState } from "react";
import { Button, Heading, Stack, Text, UploadQueue } from "rebar-ui";
import type { UploadQueueItem } from "rebar-ui";
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
        code: '<UploadQueue\n  items={items}\n  onPause={(id) => pause(id)}\n  onResume={(id) => resume(id)}\n  onRetry={(id) => retry(id)}\n  onDismiss={(id) => dismiss(id)}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["UploadQueue"] ?? [] },
  {
    type: "doc-section",
    heading: "A persistent, minimizable floating panel",
    body: [
      {
        kind: "text",
        text: 'Portal-rendered to a fixed corner (same convention `Tour`/`ContextMenu` use), so it visually survives page content changes underneath it — distinct from `FileUpload`, which handles the dropzone/picker itself, not an app-wide queue. Renders nothing at all when `items` is empty.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="upload-queue"`, `data-rebar-state="minimized" | "expanded"`; each row carries `data-rebar-status`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Progress` + `List` inside a fixed-position `Affix`/plain `div`.",
      },
    ],
  },
];

export default function UploadQueuePage() {
  const [items, setItems] = useState<UploadQueueItem[]>([
    { id: "1", name: "quarterly-report.pdf", progress: 62, status: "uploading" },
    { id: "2", name: "hero-image.png", progress: 100, status: "done" },
    { id: "3", name: "dataset.csv", progress: 30, status: "error", errorMessage: "Connection lost" },
  ]);

  return (
    <Stack gap="lg">
      <Heading level={1}>UploadQueue</Heading>
      <Text color="secondary">
        A persistent, app-wide floating panel showing all in-flight uploads with pause/resume/retry.
      </Text>

      <Button onClick={() => setItems([])}>Clear all (hide the queue)</Button>

      <UploadQueue
        items={items}
        onRetry={(id) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "uploading", progress: 0 } : i)))}
        onDismiss={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
