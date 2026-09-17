"use client";

import { useState } from "react";
import { Heading, Rate, Stack, Text } from "rebar-ui";
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
        code: '<Rate defaultValue={3} aria-label="Rate this product" />\n\n// controlled\nconst [value, setValue] = useState(0);\n<Rate value={value} onChange={setValue} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Rate"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`role="radiogroup"` over real `role="radio"` buttons, one per star, each labeled "N stars" — Left/Down decreases, Right/Up increases, matching the standard radio-group keyboard pattern. Only the checked (or first) star sits in the Tab order; the rest are reached via arrow keys, not Tab, same as any other radio group.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="rate"`, `data-rebar-part="star"` on each star.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Rate` has the same `value`/`defaultValue`/`count`/`disabled`/`onChange` shape, plus an `allowHalf` option this component doesn't support yet (a real, stated scope limitation, not an oversight — half-star hit-testing is real added complexity deferred for now). Not yet codemod-covered.",
      },
    ],
  },
];

export default function RatePage() {
  const [value, setValue] = useState(0);

  return (
    <Stack gap="lg">
      <Heading level={1}>Rate</Heading>
      <Text color="secondary">
        A star rating input — click or use the arrow keys. No half-star support in this first
        pass, a stated limitation, not an oversight.
      </Text>

      <LivePreview>
        <Stack gap="md">
          <Rate defaultValue={3} aria-label="Uncontrolled example" />
          <Stack direction="row" gap="sm" align="center">
            <Rate value={value} onChange={setValue} aria-label="Controlled example" />
            <Text size="sm" color="secondary">
              {value} / 5
            </Text>
          </Stack>
          <Rate defaultValue={2} disabled aria-label="Disabled example" />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
