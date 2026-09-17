import { Barcode, Box, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Barcode value="SKU-48213" showText />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Barcode"] ?? [] },
  {
    type: "doc-section",
    heading: "A real, scannable Code 128 barcode",
    body: [
      {
        kind: "text",
        text: 'Encoded via the `code-128-encoder` package — deps: none, and purpose-built as "an encoder, not a renderer," exactly the shape needed here (the component owns its own SVG rendering, rather than delegating to a library that draws directly into the DOM itself). Code 128 was chosen over older, narrower symbologies (Code 39, etc.) because it covers the full printable ASCII range through automatic code-set switching — hand-rolling that switching logic and the checksum risks a code that *looks* right but doesn\'t scan, the same "small, correctness-critical dependency" tradeoff `QRCode`\'s own `qrcode` dependency already made. Cross-checked directly against a second, independent encoder (`jsbarcode`) during development — both produced the identical bar pattern for the same input.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Width scales with content, not squeezed to fit",
    body: [
      {
        kind: "text",
        text: "`barWidth` sets the narrowest bar's width in px; the code's total width scales with content length at that fixed unit, the way a real barcode has to — squishing an arbitrary total width to fit would break the module-width ratios a scanner relies on to read it. `quietZone` (default 10× `barWidth`) adds the blank margin a scanner needs to reliably find the code's edges.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="barcode"` on the root `<svg>`; each bar carries `data-rebar-part="bar"`, the human-readable text (when `showText` is on) carries `data-rebar-part="text"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD ships no barcode component of its own — a migration typically reaches for `jsbarcode` or `react-barcode` directly, or keeps this component's own encoding logic and only swaps the rendering shell.",
      },
    ],
  },
];

export default function BarcodePage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Barcode</Heading>
      <Text color="secondary">
        A real, scannable Code 128 linear barcode, rendered as SVG — with the encoded value shown
        beneath it by default.
      </Text>

      <Box
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
          display: "flex",
          gap: "var(--rebar-space-lg)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Barcode value="SKU-48213" />
        <Barcode value="ORDER-99120" showText={false} barWidth={3} color="#0066cc" />
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
