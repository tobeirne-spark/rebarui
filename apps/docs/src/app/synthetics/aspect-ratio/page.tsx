import { AspectRatio, Carousel, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

// Every standard ratio the built-in placeholder set covers, in ascending order.
const ALL_RATIOS: { label: string; ratio: number }[] = [
  { label: "9:16", ratio: 9 / 16 },
  { label: "6:11", ratio: 6 / 11 },
  { label: "1:2", ratio: 1 / 2 },
  { label: "2:3", ratio: 2 / 3 },
  { label: "3:4", ratio: 3 / 4 },
  { label: "4:5", ratio: 4 / 5 },
  { label: "5:6", ratio: 5 / 6 },
  { label: "1:1", ratio: 1 },
  { label: "6:5", ratio: 6 / 5 },
  { label: "5:4", ratio: 5 / 4 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "2:1", ratio: 2 / 1 },
  { label: "7:3", ratio: 7 / 3 },
];

const VARIANT_COUNT = 5;

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<AspectRatio ratio={16 / 9} src="/photos/hero.jpg" alt="Product hero shot" />\n<AspectRatio ratio={1} placeholder />\n<AspectRatio />`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["AspectRatio"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "Pass a meaningful `alt` when using a real `src`; when only `placeholder` is set (or neither is set), the image/box is decorative and `alt` is left empty automatically.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="aspect-ratio"` on the root; `data-rebar-part="empty"` on the placeholder box when neither `src` nor `placeholder` is set.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD has no dedicated aspect-ratio component — this one has no direct equivalent to rename to, similar to `Box`/`Stack`. Migrating means replacing it with whatever fixed-ratio container convention the target codebase already uses (a CSS utility class, a wrapper div with a padding-top trick, etc.), by hand or via the migration prompt.",
      },
    ],
  },
];

export default function AspectRatioPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>AspectRatio</Heading>
      <Text color="secondary">
        Keeps content at a fixed width/height ratio (Radix underneath). An empty, low-fidelity box
        by default — Rebar stays barebones until you supply a real <code>src</code>. Set{" "}
        <code>placeholder</code> to show one of Rebar&apos;s built-in illustrated placeholder
        images instead of a bare box while you don&apos;t have a real image yet — it picks
        whichever embedded placeholder&apos;s own ratio is numerically closest to the one you ask
        for, not an exact-name match, so any ratio you pass gets <em>something</em> reasonable.
      </Text>

      <Text size="sm" color="secondary">
        All {ALL_RATIOS.length} supported ratios. Not a <code>Carousel</code> — a carousel holds
        one aspect ratio at a time (its viewport has a single fixed height, so mixed ratios leave
        dead space around shorter slides); a catalog that&apos;s deliberately showing many
        different shapes belongs in a plain wrapping grid instead, each item sized to its own ratio.
      </Text>
      <LivePreview>
        <Stack direction="row" gap="md" style={{ flexWrap: "wrap" }}>
          {ALL_RATIOS.map((r) => (
            <Stack key={r.label} gap="xs" style={{ width: 140 }}>
              <AspectRatio ratio={r.ratio} placeholder />
              <Text size="xs" color="secondary" style={{ textAlign: "center" }}>
                {r.label}
              </Text>
            </Stack>
          ))}
        </Stack>
      </LivePreview>

      <Stack gap="sm">
        <Heading level={2}>Same ratio, real variety</Heading>
        <Text size="sm" color="secondary">
          Several placeholder photos share each ratio, not just one — pass a number (e.g. a{" "}
          <code>Carousel</code>&apos;s slide index) to pick a specific variant instead of always
          the same image.
        </Text>
        <LivePreview>
          <Carousel aria-label="16:9 placeholder variants">
            {Array.from({ length: VARIANT_COUNT }, (_, i) => (
              <AspectRatio key={i} ratio={16 / 9} placeholder={i} />
            ))}
          </Carousel>
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
