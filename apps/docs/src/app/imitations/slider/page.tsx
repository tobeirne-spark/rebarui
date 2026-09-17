"use client";

import { useState } from "react";
import { Heading, Slider, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [{ kind: "code", code: '<Slider value={value} onValueChange={setValue} min={0} max={100} step={5} />' }],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Slider"] ?? [] },
  {
    type: "doc-section",
    heading: "A real Radix single-value slider",
    body: [
      {
        kind: "text",
        text: '`value`/`defaultValue`/`onValueChange` (controlled/uncontrolled, same convention as every other stateful component here), `min`/`max`/`step`. The discrete-index scrubber used by `WaybackSlider`/`PickerWheel`-adjacent components is built directly on this.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [{ kind: "text", text: '`data-rebar-component="slider"` on the root.' }],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: "AntD's `Slider` takes the same `value`/`onChange`/`min`/`max`/`step` shape — a close, low-risk rename." },
    ],
  },
];

export default function SliderPage() {
  const [value, setValue] = useState(40);

  return (
    <Stack gap="lg">
      <Heading level={1}>Slider</Heading>
      <Text color="secondary">A real Radix single-value slider.</Text>

      <LivePreview>
        <Stack gap="sm" style={{ maxWidth: 320 }}>
          <Slider value={value} onValueChange={setValue} min={0} max={100} step={5} aria-label="Volume" />
          <Text size="sm" color="secondary">
            {value}
          </Text>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
