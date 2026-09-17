import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [
      {
        kind: "text",
        text: "A labeled, single-aspect-ratio image carousel — screenshots named ${prefix}-01.png through ${prefix}-NN.png inside dir.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [
      {
        kind: "code",
        code: "{ type: \"gallery\", label: string, dir: string, prefix: string, count?: number }",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [
      {
        kind: "text",
        text: "A live example of the gallery block:",
      },
    ],
  },
];

export default function GalleryPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Gallery</Heading>
      <Text color="secondary">
        A labeled, single-aspect-ratio image carousel — screenshots named prefix-01.png through prefix-NN.png inside dir.
      </Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
