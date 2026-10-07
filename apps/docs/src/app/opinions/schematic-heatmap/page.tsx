"use client";

import { useState } from "react";
import { Heading, SchematicHeatmap, Stack, Text } from "rebar-ui";
import type { HeatmapBrush, HeatmapRegion, HeatmapValue } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// Made-up data: a fictional campus site plan. Each region is a union of rects in the plan's own
// units; "East Hall" is an L-shape drawn from two rects and "Courtyard" is a ring (a hole in the
// middle), to show that a multi-rect region is ONE shape with one outline.
const BRUSHES: HeatmapBrush[] = [
  { id: "building", label: "Building", color: "#0066cc" },
  { id: "outdoor", label: "Outdoor", color: "#2e7d32", showLabel: true },
  { id: "service", label: "Service", color: "#757575", showLabel: false },
];

const REGIONS: HeatmapRegion[] = [
  { id: "north-block", kind: "building", label: "North Block", rects: [[0, 0, 220, 90]] },
  { id: "east-hall", kind: "building", label: "East Hall", rects: [[230, 0, 380, 90], [290, 90, 380, 190]] },
  { id: "library", kind: "building", label: "Library", rects: [[0, 100, 120, 190]] },
  {
    id: "courtyard",
    kind: "outdoor",
    label: "Courtyard",
    rects: [[130, 100, 280, 120], [130, 170, 280, 190], [130, 120, 150, 170], [260, 120, 280, 170]],
  },
  { id: "car-park", kind: "outdoor", label: "Car park", rects: [[0, 200, 280, 260]] },
  { id: "plant-room", kind: "service", label: "Plant", rects: [[290, 200, 380, 260]] },
  { id: "pump-house", kind: "service", label: "Pump house", rects: [[390, 0, 430, 40]] },
];

const VALUES: Record<string, HeatmapValue> = {
  "north-block": { done: 182, expected: 200 },
  "east-hall": { done: 96, expected: 210 },
  library: { done: 12, expected: 140 },
  courtyard: 0.55,
  "car-park": { done: 40, expected: 40 },
  // plant-room and pump-house deliberately have no entry — "no data", not 0%.
};

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<SchematicHeatmap\n  ariaLabel="Handover progress by zone"\n  regions={[{ id: "north-block", kind: "building", label: "North Block", rects: [[0, 0, 220, 90]] }, /* ... */]}\n  values={{ "north-block": { done: 182, expected: 200 }, courtyard: 0.55 }}\n  crop={[-10, -10, 440, 270]}\n  selectedId={selected}\n  onSelect={setSelected}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["SchematicHeatmap"] ?? [] },
  {
    type: "doc-section",
    heading: "What it's for",
    body: [
      {
        kind: "text",
        text: "Heatmap is a row-by-column matrix and GeoChart projects a map; neither can draw a floor plan, a site layout or a long thin strip of intervals *where the source drawing has them*. SchematicHeatmap draws arbitrary rectangle-union regions at their own coordinates and shades each by how complete it is, optionally over a tracing image of the original drawing. Nothing in it knows what the numbers mean — the host supplies `values` keyed by region id, and brings its own filters and table view alongside.",
      },
      {
        kind: "text",
        text: "`HeatmapPainter` is its authoring counterpart: paint the regions on a canvas, and the layout it produces (`HeatmapLayout`) feeds straight into this component's `regions`, `brushes`, `background` and a frame's `crop`.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "One region, one shape",
    body: [
      {
        kind: "text",
        text: 'A region painted as several rectangles is drawn with one fill per rect but a single closed outline around the whole union — computed by the exported pure helper `outlinePath(rects)`, which traces the outer boundary and any holes (the Courtyard above is a ring). That is why East Hall reads as one L-shaped block with no seam line where its two rects meet. The outline is a closed path, so `stroke-linejoin` rounds its corners.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "No data is not zero",
    body: [
      {
        kind: "text",
        text: "A region with no entry in `values`, a non-finite number, or `expected <= 0` is drawn as a neutral diagonal hatch, never as the lightest shade. \"Nothing was collected here\" and \"0% complete\" are different claims. `values` accepts either `{ done, expected }` (shaded by `done / expected`) or a ready-made 0..1 share. The default `colorScale` is eight steps of `--rebar-color-primary` blended into the page background; pass your own `colorScale` to change it, and `labels`/`formatValue` to change the wording.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Selection and keyboard",
    body: [
      {
        kind: "text",
        text: "Each region is a focusable `role=\"button\"` with an accessible name carrying its value. Hover or focus shows its numbers in the readout; click, Enter or Space pins it (`aria-pressed`), Escape un-pins. Selection is controlled via `selectedId`/`onSelect` (where `null` means \"none\") or uncontrolled via `defaultSelectedId`.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Exported helpers",
    body: [
      {
        kind: "text",
        text: "Pure functions, importable from `rebar-ui`: `outlinePath`, `regionBounds`, `contentBounds`, `framesOf`, `brushesOf`, `brushesInFrame`, `regionsInFrame`, `defaultVisibleBrushes`, `shareOf`, `labelLayout`. A host builds its own brush filter chips and frame picker from `brushesInFrame`/`regionsInFrame`/`framesOf` and passes the filtered `regions` and the chosen frame's `crop` in.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="schematic-heatmap"` on the root `<figure>`; `data-rebar-state` is `idle`, `hovering` or `selected`. Parts: `canvas` (the `<svg>`), `background`, `region` (with `data-region="<id>"` and `data-rebar-state` of `value`, `no-data` or `selected`), `region-outline`, `region-label`, `legend-row`, `readout`, `legend`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chart or schematic components (it points to `@ant-design/charts`), and there is no 1:1 mapping. Keep this component as a small owned SVG, or redraw regions in your charting library of choice.",
      },
    ],
  },
];

export default function SchematicHeatmapPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Stack gap="lg">
      <Heading level={1}>SchematicHeatmap</Heading>
      <Text color="secondary">
        Regions drawn at their own coordinates over a site plan, each shaded by how complete it is —
        hatched where there is no data. Hover, focus or click a region.
      </Text>

      <SchematicHeatmap
        ariaLabel="Handover progress by zone, fictional campus"
        regions={REGIONS}
        brushes={BRUSHES}
        values={VALUES}
        crop={[-10, -10, 440, 270]}
        selectedId={selected}
        onSelect={setSelected}
      />
      <Text size="sm" color="secondary">
        {selected ? `Pinned: ${selected} (controlled by this page's own state).` : "Nothing pinned."} The
        data here is made up.
      </Text>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
