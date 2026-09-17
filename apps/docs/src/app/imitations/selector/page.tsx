"use client";

import { useState } from "react";
import { Heading, Selector, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SIZE_OPTIONS = [
  { label: "XS", value: "xs" },
  { label: "S", value: "s" },
  { label: "M", value: "m" },
  { label: "L", value: "l" },
  { label: "XL", value: "xl", disabled: true },
];

const SHIPPING_OPTIONS = [
  { label: "Standard", description: "5-7 days", value: "standard" },
  { label: "Express", description: "2-3 days", value: "express" },
  { label: "Overnight", description: "Next day", value: "overnight" },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<Selector options={[{ label: "XS", value: "xs" }, { label: "S", value: "s" }]} value={size} onValueChange={([v]) => setSize(v)} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Selector"] ?? [] },
  {
    type: "doc-section",
    heading: "Every option visible at once — no menu to open first",
    body: [
      {
        kind: "text",
        text: "The antd-mobile `Selector` pattern: distinct from `MultiSelect`'s dropdown, every option is a real, tappable chip shown up front. Reach for this when the option count is small enough to show in full (a size picker, a handful of filters); reach for `MultiSelect`/`Combobox` once the list needs searching or scrolling.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="selector"` on the root; parts: `chip`, `chip-label`, `chip-description`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — the antd-mobile pattern. AntD desktop has no direct equivalent; a `Checkbox.Group`/`Radio.Group` with `optionType=\"button\"` is the closest structural match.",
      },
    ],
  },
];

export default function SelectorPage() {
  const [size, setSize] = useState<(string | number)[]>(["m"]);
  const [shipping, setShipping] = useState<(string | number)[]>([]);

  return (
    <Stack gap="lg">
      <Heading level={1}>Selector</Heading>
      <Text color="secondary">
        A grid of selectable chips — single or multiple choice, every option visible and tappable
        at once.
      </Text>

      <LivePreview>
        <Stack gap="lg" style={{ maxWidth: 420 }}>
          <Stack gap="xs">
            <Text size="sm" color="secondary">
              Size (single-select)
            </Text>
            <Selector options={SIZE_OPTIONS} value={size} onValueChange={setSize} />
          </Stack>
          <Stack gap="xs">
            <Text size="sm" color="secondary">
              Shipping (with descriptions)
            </Text>
            <Selector options={SHIPPING_OPTIONS} value={shipping} onValueChange={setShipping} columns={1} />
          </Stack>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
