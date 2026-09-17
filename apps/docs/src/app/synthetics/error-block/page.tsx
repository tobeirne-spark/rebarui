import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A whole-page failure/empty state — status picks a sensible default icon/title/description (default, disconnected, empty, busy), all overridable; action renders a real retry button the same small-secondary way banner/header/callout render theirs. This project's first genuinely Mobile-only block (see ref/BLOCKS.md) — every other antd-mobile-derived pattern shipped so far landed as a packages/core component only, never promoted into a block. fullPage is on by default here, since a dedicated block for this is specifically for the whole-page case; set it false for an inline, one-card failure state." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "error-block", status?: "default"|"disconnected"|"empty"|"busy", title?: string, description?: string, action?: Action, fullPage?: boolean }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the error-block block:" }],
  },
  {
      type: "error-block",
      status: "disconnected",
      action: {
        label: "Retry",
      },
    },
];

export default function ErrorBlockPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Error Block</Heading>
      <Text color="secondary">{"A whole-page failure/empty state — status picks a sensible default icon/title/description (default, disconnected, empty, busy), all overridable; action renders a real retry button the same small-secondary way banner/header/callout render theirs. This project's first genuinely Mobile-only block (see ref/BLOCKS.md) — every other antd-mobile-derived pattern shipped so far landed as a packages/core component only, never promoted into a block. fullPage is on by default here, since a dedicated block for this is specifically for the whole-page case; set it false for an inline, one-card failure state."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
