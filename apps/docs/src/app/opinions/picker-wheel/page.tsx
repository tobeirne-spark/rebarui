"use client";

import { useState } from "react";
import { Heading, PickerWheel, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `const [value, setValue] = useState("1");\n\n<PickerWheel options={["1","2","3", /* ... */]} value={value} onValueChange={setValue} />`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["PickerWheel"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from Calendar's grid or TimePicker's list",
    body: [
      {
        kind: "text",
        text: "This is the iOS `UIPickerView` interaction specifically — one option centered in a fixed viewport, drag or mouse-wheel to spin the list, snapping the nearest option to center on release. `Calendar` is a grid, `TimePicker` is a scrollable button list — different shapes for different jobs.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Three real input paths, not just drag",
    body: [
      {
        kind: "text",
        text: "Plain pointer-drag, a real mouse-wheel listener, and — the genuine non-drag fallback (ref/HEURISTICS.md #38) — every option is its own always-clickable real button; clicking one not currently centered scrolls it to center and selects it, exactly like clicking any other control.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="picker-wheel"`; parts: `track`, `option` (selected one carries `data-rebar-selected`), `highlight`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD (the web-focused library) has no direct equivalent — a spinning-wheel picker is a mobile-native pattern (Cupertino's `UIPickerView`, React Native's `Picker`). antd-mobile's `PickerView` is the closer sibling library if the migration target is genuinely mobile.",
      },
    ],
  },
];

export default function PickerWheelPage() {
  const [value, setValue] = useState("6");

  return (
    <Stack gap="lg">
      <Heading level={1}>PickerWheel</Heading>
      <Text color="secondary">
        A spinning-wheel value selector — drag, scroll, or click any visible option directly.
      </Text>

      <Stack gap="sm" style={{ maxWidth: 200 }}>
        <PickerWheel options={HOURS} value={value} onValueChange={setValue} aria-label="Hour" />
        <Text size="sm" color="secondary">
          Selected: {value}
        </Text>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
