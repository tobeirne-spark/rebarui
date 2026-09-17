import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A wrapping row of small title+body pairs — no links, no images, just short feature copy." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "feature-grid", items: { title: string, body: string }[] }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the feature-grid block:" }],
  },
  {
      type: "feature-grid",
      items: [
        {
          title: "Headless",
          body: "Radix underneath.",
        },
        {
          title: "Replaceable",
          body: "CSS-variable theming.",
        },
        {
          title: "Tested",
          body: "Playwright-checked on every change.",
        },
      ],
    },
];

export default function FeatureGridPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Feature Grid</Heading>
      <Text color="secondary">{"A wrapping row of small title+body pairs — no links, no images, just short feature copy."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
