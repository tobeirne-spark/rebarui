import { AspectRatio, Carousel, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const SLIDE_COUNT = 4;
const EXAMPLE_RATIO = 4 / 3;

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<Carousel aria-label="Example photos">\n  <img src="/one.jpg" alt="" />\n  <img src="/two.jpg" alt="" />\n  <img src="/three.jpg" alt="" />\n</Carousel>\n\n// controlled\n<Carousel index={index} onIndexChange={setIndex}>\n  {slides}\n</Carousel>`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Carousel"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'Root carries `role="region"` and `aria-roledescription="carousel"`; each slide is a `role="group"` labeled "N of M" and hidden from assistive tech while off-screen. Left/right arrow keys navigate when the carousel has focus; the position text is an `aria-live="polite"` region so a screen reader announces the change without needing to re-enter the carousel.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="carousel"` on the root; `data-rebar-part` values `viewport`, `track`, `slide`, `controls`, and `dots` on their respective elements.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no direct `Carousel` equivalent in core (it ships one in a separate package with a different API, slide-count-driven rather than children-driven), so this is a structural rewrite at migration time, not a mechanical rename.",
      },
    ],
  },
];

export default function CarouselPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Carousel</Heading>
      <Text color="secondary">
        A single-slide-at-a-time viewport with prev/next buttons, dot indicators, and a visible
        &quot;N of M&quot; position — for compressing a run of non-text content (images, cards)
        that would otherwise sprawl into a distracting grid on a text-dominant page. No new
        dependency: plain state, no animation library.
      </Text>
      <Text size="sm" color="secondary">
        Every slide in a carousel should share one aspect ratio — mixing portrait and landscape
        content makes the container jump size between slides. Portrait and landscape photos to
        show side by side belong in two separate carousels, not one mixed one.
      </Text>

      <LivePreview>
        <Carousel aria-label="Example photos">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <AspectRatio key={i} ratio={EXAMPLE_RATIO} placeholder={i} />
          ))}
        </Carousel>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
