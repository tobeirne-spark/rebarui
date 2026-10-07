"use client";

import { useMemo, useState } from "react";
import { Heading, HeatmapPainter, SchematicHeatmap, Stack, Text, framesOf } from "rebar-ui";
import type { HeatmapLayout, HeatmapValue } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SAMPLE: HeatmapLayout = {
  cellSize: 20,
  brushes: [
    { id: "room", label: "Room", color: "#0066cc" },
    { id: "corridor", label: "Corridor", color: "#2e7d32", showLabel: false },
  ],
  frames: [{ id: "frame-1", title: "Frame 1", crop: [-20, -20, 360, 260] }],
  regions: [
    { id: "room-a", kind: "room", label: "Room A", rects: [[0, 0, 120, 100]] },
    { id: "room-b", kind: "room", label: "Room B", rects: [[160, 0, 340, 100], [240, 100, 340, 180]] },
    { id: "hall", kind: "corridor", label: "Hall", rects: [[0, 120, 220, 160]] },
  ],
};

// A stable pseudo-value per region id, so the live plot below has something to shade.
function demoValue(id: string): HeatmapValue | undefined {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const done = Math.abs(h) % 11;
  return id.includes("hall") ? undefined : { done, expected: 10 };
}

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<HeatmapPainter\n  value={layout}\n  onChange={setLayout}\n  height={560}\n  idSuggestions={knownAreaIds}\n  onUploadBackground={async (file) => ({ url: await store(file) })}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["HeatmapPainter"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "Extracting a drawing's geometry automatically proved hit-and-miss, so the layouts `SchematicHeatmap` draws are *painted*: lay a grid over a tracing image, colour in cells, and turn the painted area into a named region. This is that authoring tool, with no knowledge of where region ids or images come from. It edits one `HeatmapLayout` (cell size, brushes, optional tracing image, frames, regions) — controlled via `value`/`onChange`, or uncontrolled via `defaultValue` — and the host decides how to save it.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Using it",
    body: [
      {
        kind: "text",
        text: "The canvas is infinite: scroll pans, Ctrl/Cmd+scroll (or pinch) zooms at the cursor, hold Space (or the middle button) and drag to grab it. The **Paint** tool paints cells by dragging, Shift-drag paints a box, and starting a stroke on a painted cell erases. Name the painted area in the side panel and create the region; its rectangles are merged by a greedy run-merge (`cellsToRects`), and **Edit** loads a region's cells back for re-painting (`rectsToCells`). The **Frame** tool drags out the named rectangles a plot will show; move a frame by its body, resize it by its eight handles, press Delete to remove it. The focused canvas also takes arrow keys (pan), + / - (zoom) and 0 (fit).",
      },
      {
        kind: "text",
        text: "Painting itself is pointer-only (there is no keyboard cell cursor); every other control in the side panel is a native, keyboard-operable form control. Destructive buttons (delete, clear all) need a second press.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Host integration points",
    body: [
      {
        kind: "text",
        text: "**Region ids.** The default form is a plain text field, with `idSuggestions` offered through a native datalist. To plug in your own picker (an area search, a register lookup), pass `renderCellForm`, which receives the draft state and a `create()` function. `onCreateRegion` can transform or veto (`return false`) a region just before it is added.",
      },
      {
        kind: "text",
        text: "**Images.** The painter never uploads anything: `onUploadBackground(file)` must store the file and resolve `{ url, width?, height?, version? }`, and `onRemoveBackground` lets you delete it. Without `onUploadBackground` the upload control is not offered. On this page the handler returns a session-only `blob:` URL.",
      },
      {
        kind: "text",
        text: "**Persistence.** None — `onChange` receives the whole next layout after every edit; save it however you like. Painted-but-uncreated cells are transient UI state and never leave the component.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Exported pure helpers",
    body: [
      {
        kind: "text",
        text: "`cellsToRects`, `rectsToCells`, `outlinePath`, `fitCamera`, `zoomCameraAt`, `scrollCamera`, `dragCamera`, `screenToWorld`, `worldToScreen`, `hitHandle`, `resizeBounds`, `moveBounds`, `frameAt`, and the layout helpers. The camera, frame hit-testing and resize math are plain functions, unit-tested directly — jsdom cannot drive canvas or real pointer geometry.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="heatmap-painter"` on the root; `data-rebar-state` is the current tool (`paint` or `frame`). Parts: `stage`, `canvas`, `tools`, `tool-paint`, `tool-frame`, `zoom`, `zoom-readout`, `panel`, `toolbar`, `notice` (a `role="status"` line), `cell-form`, `frames-section`, `frame-row`, `brushes-section`, `brush-row`, `image-section`, `image-input`, `regions-section`, `region-row`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no canvas authoring component. The side panel maps onto AntD's `Collapse`, `Input`, `Select`, `Slider` and `Popconfirm`; the canvas itself is plain `<canvas>` and carries over unchanged.",
      },
    ],
  },
];

export default function HeatmapPainterPage() {
  const [layout, setLayout] = useState<HeatmapLayout>(SAMPLE);
  const frame = useMemo(() => framesOf(layout)[0]!, [layout]);
  const values = useMemo(
    () => Object.fromEntries(layout.regions.map((r) => [r.id, demoValue(r.id)])),
    [layout.regions],
  );

  return (
    <Stack gap="lg">
      <Heading level={1}>HeatmapPainter</Heading>
      <Text color="secondary">
        An infinite canvas for painting the regions a SchematicHeatmap draws. Paint a few cells,
        name them, create the region — then watch the plot below update.
      </Text>

      <HeatmapPainter
        value={layout}
        onChange={setLayout}
        height={520}
        idSuggestions={["room-c", "room-d", "plant", "stairs"]}
        onUploadBackground={async (file) => ({ url: URL.createObjectURL(file) })}
      />

      <Text size="sm" color="secondary">
        The plot below is fed straight from the painter&apos;s layout (made-up values).
      </Text>
      <SchematicHeatmap
        ariaLabel="Plot of the painted layout"
        regions={layout.regions}
        brushes={layout.brushes}
        background={layout.background}
        crop={frame.crop}
        values={values}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
