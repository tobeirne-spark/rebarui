"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { QRCodePictogramModule } from "rebar-ui";
import { Box, Heading, Input, QRCode, SegmentedControl, Stack, Text } from "rebar-ui";
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
        code: '<QRCode value="https://rebar-ui.dev" size={160} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["QRCode"] ?? [] },
  {
    type: "doc-section",
    heading: "A real, scannable code",
    body: [
      {
        kind: "text",
        text: "Encoded via the `qrcode` package's synchronous `create()` API, not hand-rolled — Reed-Solomon error correction and module placement are genuinely intricate to get right, and a code that *looks* right but doesn't scan is worse than not shipping one at all. This is the same \"small, correctness-critical dependency\" tradeoff `AspectRatio`'s Radix primitive already made. Rendered as real SVG rects, not a raster image, so it stays crisp at any size.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Overlaying an icon",
    body: [
      {
        kind: "text",
        text: '`icon` accepts either an image URL/data URI, or raw inline SVG content authored against a 24×24 viewBox — no data-URI encoding needed for a plain vector logo. Default size is 20% of the code\'s width, via `iconSizeRatio` — pair it with `errorCorrectionLevel="H"` so enough of the code survives being partly covered to still scan reliably.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Drawing a pictograph in the code's own modules",
    body: [
      {
        kind: "text",
        text: '`pictogram` is a grid of per-module overrides, indexed `[row][col]`: `true`/a color string forces that module dark (with that color); `false` forces it light even where the real data is dark; `undefined` leaves the real encoded value alone. Recoloring an already-dark module is always safe — it never changes what the code decodes to. Forcing a module light or dark that disagrees with the real data spends into the same error-correction budget `icon` does, so heavier use pairs with `errorCorrectionLevel="H"`, and it\'s worth actually testing that the result still scans, the same way this project verified `QRCode` itself with a real decoder before shipping it.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="qrcode"` on the root `<svg>`, which also carries `data-rebar-module-count` (the real module grid size — useful for sizing a `pictogram` grid to the actual code, as the demo above does). Each rendered module carries `data-rebar-part="module"`; the overlay carries `data-rebar-part="icon"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `QRCode` component is a close structural match (`value`/`size`/`color`/`bgColor`/`icon`/`errorCorrectionLevel`) for the core props — `pictogram` has no AntD equivalent, since it's not a shape AntD's own component supports; a migration keeping that effect needs to reimplement it or drop it.",
      },
    ],
  },
];

// A small 9x8 heart bitmap, drawn using the code's own modules — 1 forces that module dark,
// 0 forces it light (never left ambiguous), so the shape reads clearly regardless of what the
// real encoded data happens to be underneath it.
const HEART_BITMAP = [
  [0, 1, 1, 0, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
];

function buildHeartPictogram(moduleCount: number): QRCodePictogramModule[][] {
  const grid: QRCodePictogramModule[][] = Array.from({ length: moduleCount }, () =>
    Array<QRCodePictogramModule>(moduleCount).fill(undefined),
  );
  const rowOffset = Math.floor((moduleCount - HEART_BITMAP.length) / 2);
  const colOffset = Math.floor((moduleCount - HEART_BITMAP[0].length) / 2);
  HEART_BITMAP.forEach((row, r) => {
    row.forEach((bit, c) => {
      const targetRow = rowOffset + r;
      const targetCol = colOffset + c;
      if (targetRow >= 0 && targetRow < moduleCount && targetCol >= 0 && targetCol < moduleCount) {
        grid[targetRow][targetCol] = bit === 1 ? "#d32f2f" : false;
      }
    });
  });
  return grid;
}

// A plain two-tone dot logo, authored against a 24x24 viewBox — passed as inline SVG content
// (not a URL), demonstrating the icon prop's other accepted shape.
const DOT_LOGO_ICON = (
  <>
    <circle cx={12} cy={12} r={11} fill="#0066cc" />
    <circle cx={12} cy={12} r={5} fill="#ffffff" />
  </>
);

type CenterMode = "none" | "icon" | "pictogram";

export default function QRCodePage() {
  const [value, setValue] = useState("https://rebar-ui.dev");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [centerMode, setCenterMode] = useState<CenterMode>("icon");
  const [moduleCount, setModuleCount] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Read the real module grid size back off the rendered svg — needed to size the pictogram
  // grid to the actual code, which depends on `value`'s length and `level` (both change which
  // QR version gets picked), not something computable ahead of render.
  useEffect(() => {
    const svg = containerRef.current?.querySelector('[data-rebar-component="qrcode"]');
    const count = svg?.getAttribute("data-rebar-module-count");
    setModuleCount(count ? Number(count) : null);
  }, [value, level, centerMode]);

  const pictogram = useMemo(() => {
    if (centerMode !== "pictogram" || !moduleCount) return undefined;
    return buildHeartPictogram(moduleCount);
  }, [centerMode, moduleCount]);

  return (
    <Stack gap="lg">
      <Heading level={1}>QRCode</Heading>
      <Text color="secondary">
        A real, scannable QR code, rendered as SVG — play with the controls below.
      </Text>

      <Stack gap="md" style={{ maxWidth: 420 }}>
        <Input
          aria-label="Value to encode"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            Error correction level
          </Text>
          <SegmentedControl
            value={level}
            onValueChange={(v) => setLevel(v as "L" | "M" | "Q" | "H")}
            options={[
              { value: "L", label: "L" },
              { value: "M", label: "M" },
              { value: "Q", label: "Q" },
              { value: "H", label: "H" },
            ]}
          />
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            Center decoration
          </Text>
          <SegmentedControl
            value={centerMode}
            onValueChange={(v) => setCenterMode(v as CenterMode)}
            options={[
              { value: "none", label: "None" },
              { value: "icon", label: "Icon" },
              { value: "pictogram", label: "Pictograph" },
            ]}
          />
        </Stack>
      </Stack>

      <Box
        ref={containerRef}
        style={{
          border: "1px solid var(--rebar-color-border, #e0e0e0)",
          borderRadius: 4,
          padding: "var(--rebar-space-lg)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {value ? (
          <QRCode
            value={value}
            size={200}
            errorCorrectionLevel={level}
            icon={centerMode === "icon" ? DOT_LOGO_ICON : undefined}
            pictogram={pictogram}
          />
        ) : (
          <Text size="sm" color="secondary">
            Enter a value to encode.
          </Text>
        )}
      </Box>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
