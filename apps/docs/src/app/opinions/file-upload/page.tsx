"use client";

import { useState } from "react";
import type { UploadFileState } from "rebar-ui";
import { FileUpload, Heading, Stack, Text } from "rebar-ui";
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
        code: `const [files, setFiles] = useState<UploadFileState[]>([]);\n\n<FileUpload\n  multiple\n  maxSizeBytes={5 * 1024 * 1024}\n  files={files}\n  onFilesSelected={(picked) => {\n    // ...start your own real upload here, then feed progress back in via \`files\`\n  }}\n  onRemove={(file) => setFiles((prev) => prev.filter((f) => f.id !== file.id))}\n/>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["FileUpload"] ?? [] },
  {
    type: "doc-section",
    heading: "This component doesn't upload anything itself",
    body: [
      {
        kind: "text",
        text: "`FileUpload` is a real, working *selection + drag-and-drop + client-side validation + progress display* widget — it has no server to talk to, so `onFilesSelected` just hands you the picked files, and you own the actual upload call. Progress comes back in through the controlled `files` prop: update each file's `status`/`progress` as your own upload reports it, and the component reflects it via a real `Progress` bar.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "A real non-drag fallback",
    body: [
      {
        kind: "text",
        text: "Drag-and-drop always has a non-drag alternative (ref/HEURISTICS.md #38) — the picker button opens the same native file dialog a drop would populate, fully keyboard-operable.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="file-upload"`; parts: `dropzone`, `picker`, `input`, `list`, `file-row` (each row also carrying `file-name`/`file-size`/`file-status`/`remove`).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Upload` component is a close structural match, but it owns real upload-request logic internally (an `action` URL, `customRequest`) — this component deliberately doesn't, so a migration is an opportunity to either adopt AntD's built-in request handling or keep your own upload logic and just swap the rendering shell.",
      },
    ],
  },
];

export default function FileUploadPage() {
  const [files, setFiles] = useState<UploadFileState[]>([
    { id: "1", name: "budget-2026.xlsx", size: 245_000, status: "done" },
    { id: "2", name: "roadmap.pdf", size: 1_200_000, status: "uploading", progress: 45 },
  ]);

  return (
    <Stack gap="lg">
      <Heading level={1}>FileUpload</Heading>
      <Text color="secondary">
        A dedicated drag-and-drop upload widget with progress — not a bare native file input.
      </Text>

      <FileUpload
        multiple
        maxSizeBytes={5 * 1024 * 1024}
        files={files}
        onFilesSelected={(picked) => {
          setFiles((prev) => [
            ...prev,
            ...picked.map((file, i) => ({
              id: `${Date.now()}-${i}`,
              name: file.name,
              size: file.size,
              status: "pending" as const,
            })),
          ]);
        }}
        onRemove={(file) => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
