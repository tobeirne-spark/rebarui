"use client";

import { useState } from "react";
import { FileManager, Heading, Stack, Text } from "rebar-ui";
import type { FileManagerNode } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const INITIAL_ROOT: FileManagerNode = {
  id: "root",
  name: "Root",
  type: "folder",
  children: [
    {
      id: "docs",
      name: "Docs",
      type: "folder",
      children: [{ id: "readme", name: "readme.txt", type: "file", size: 2048 }],
    },
    { id: "photo", name: "photo.png", type: "file", size: 2 * 1024 * 1024 },
  ],
};

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<FileManager root={root} onMove={(ids, targetId) => move(ids, targetId)} onRename={(id, name) => rename(id, name)} onDelete={(ids) => remove(ids)} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["FileManager"] ?? [] },
  {
    type: "doc-section",
    heading: "In-memory only — no real file I/O",
    body: [
      {
        kind: "text",
        text: "Every mutation is reported back to the caller (onMove/onRename/onDelete) — the same convention FileUpload already established for uploads. Composes the real TreeView for folder navigation, Table for the sortable contents view, ContextMenu for the real non-drag Move-to fallback, and Editable for inline rename.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Arbitrary actions, not just delete",
    body: [
      {
        kind: "text",
        text: "The built-in Delete button covers exactly one operation. `actions` (an array of `{ key, label, disabled?, onSelect, variant? }`) adds arbitrary further caller-defined buttons alongside it — each fires with the current selection so a caller can wire up a zip-and-download flow, sharing, or opening in another tool without this component needing to know what any of those mean. Shown only while at least one item is selected, same as Delete; `disabled` can narrow an action to a specific selection shape (e.g. exactly one file).",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "singleFileMode — a constrained single-file picker",
    body: [
      {
        kind: "text",
        text: "For embedding a \"pick one file\" control (e.g. inside a form) rather than a full dual-pane browser: hides the folder-navigation sidebar and the grid/table view toggle (forced to grid), and selecting a file replaces the selection instead of adding to it.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Grid view supports drag-and-drop; table view uses Move to…",
    body: [
      {
        kind: "text",
        text: "Table's own column API has no row-level drag hooks, so native drag-and-drop between folders works in the grid view (every tile is this component's own DOM); table view relies on the ContextMenu's Move to… fallback as its primary move mechanism — an honest scope boundary, not a gap, and heuristic #38 (a real non-drag alternative) holds in both views.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="file-manager"`; parts include `tree`, `toolbar`, `grid`, and `item`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Tree` + `Table` + `Dropdown` directly against the same node shape.",
      },
    ],
  },
];

function removeIds(node: FileManagerNode, ids: string[]): FileManagerNode {
  return {
    ...node,
    children: node.children?.filter((c) => !ids.includes(c.id)).map((c) => removeIds(c, ids)),
  };
}

function renameId(node: FileManagerNode, id: string, name: string): FileManagerNode {
  if (node.id === id) return { ...node, name };
  return { ...node, children: node.children?.map((c) => renameId(c, id, name)) };
}

export default function FileManagerPage() {
  const [root, setRoot] = useState(INITIAL_ROOT);
  const [lastAction, setLastAction] = useState("none yet");
  const [pickedId, setPickedId] = useState<string[]>([]);

  return (
    <Stack gap="lg">
      <Heading level={1}>FileManager</Heading>
      <Text color="secondary">
        A caller-supplied in-memory folder tree with a two-pane browser UI — no real cloud storage
        integration.
      </Text>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Select an item to see Delete and a caller-supplied "Zip & download" action appear. Last
          action fired: <strong>{lastAction}</strong>
        </Text>
        <FileManager
          root={root}
          onRename={(id, name) => setRoot(renameId(root, id, name))}
          onDelete={(ids) => setRoot(removeIds(root, ids))}
          onMove={(ids, targetId) => setLastAction(`move ${ids.join(", ")} to ${targetId}`)}
          actions={[
            {
              key: "zip",
              label: "Zip & download",
              onSelect: (ids) => setLastAction(`zip & download ${ids.join(", ")}`),
            },
            {
              key: "download",
              label: "Download",
              disabled: (ids) => ids.length !== 1,
              onSelect: (ids) => setLastAction(`download ${ids[0]}`),
            },
          ]}
        />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          singleFileMode — no sidebar, no view toggle, single selection
        </Text>
        <FileManager root={INITIAL_ROOT} singleFileMode onSelectedIdsChange={setPickedId} />
        <Text size="sm" color="secondary">
          Picked: {pickedId[0] ?? "none"}
        </Text>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
