import { Button, Empty, Heading, Stack, Text } from "rebar-ui";
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
        code: '<Empty />\n<Empty illustration="bowl-and-spoon" description="No projects yet">\n  <Button variant="primary">Create project</Button>\n</Empty>\n<Empty icon="vector" description="No results" />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Empty"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: 'The illustration is a real `<img>` with `alt=""` — a screen reader only hears the description text (and any action button), never the decorative image.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="empty"`, `data-rebar-part="icon" | "description" | "action"`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Empty` ships several built-in illustration presets (`Empty.PRESENTED_IMAGE_SIMPLE` etc.), while this component has two hand-drawn illustrations (a ghost, the default, and the original bowl-and-spoon, picked via `illustration`) plus a plain vector fallback, picked via `icon`, not a larger preset set. `description` and an action child map directly.",
      },
    ],
  },
];

export default function EmptyPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Empty</Heading>
      <Text color="secondary">
        A placeholder for a list, table, or panel with nothing to show. A hand-drawn illustration
        (a ghost by default, or the original bowl-and-spoon via <code>illustration</code>, from the
        same placeholder art set as <code>Avatar</code>/<code>AspectRatio</code>), by default
        swapped automatically for a plain vector circle-and-X in dark mode — since the illustration
        is a raster image, it can&apos;t recolor itself for a dark background. Set{" "}
        <code>icon</code> to keep one or the other in both themes instead.
      </Text>

      <LivePreview>
        <Stack gap="lg">
          <Empty />
          <Empty illustration="bowl-and-spoon" description="No projects yet">
            <Button variant="primary">Create project</Button>
          </Empty>
          <Stack direction="row" gap="lg">
            <Empty icon="illustration" description="Illustration, forced" />
            <Empty icon="vector" description="Vector, forced" />
          </Stack>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
