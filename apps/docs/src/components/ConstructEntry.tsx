import type { ReactNode } from "react";
import { Box, CodeBlock, Heading, Stack, Tag, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

/** A block's own detail entry within its tier page — description, shape, and (usually) a real live
 * demo. Shared across the four tier pages (moved here from the old single /blocks page, which this
 * replaces — each tier page now inlines only the blocks that actually belong to it). */
export function ConstructEntry({
  id,
  measured,
  description,
  shape,
  code,
  blocks,
  demoMaxWidth,
}: {
  id: string;
  measured: boolean;
  description: ReactNode;
  shape: string;
  code?: string;
  blocks?: Construct[];
  /** Caps the live-example box's width — for a block whose behavior only shows up when it's
      genuinely width-constrained (nav-bar's overflow collapse), rather than relying on a reader
      manually narrowing their browser to see it. */
  demoMaxWidth?: number;
}) {
  return (
    <Stack
      gap="sm"
      id={id}
      style={{
        borderTop: "1px solid var(--rebar-color-border, #e0e0e0)",
        paddingTop: "var(--rebar-space-lg)",
      }}
    >
      <Stack direction="row" gap="sm" align="center">
        <Heading level={3} style={{ margin: 0 }}>
          <code>{id}</code>
        </Heading>
        <Tag tone={measured ? "success" : "warning"} style={{ textTransform: "uppercase" }}>
          {measured ? "measured" : "unmeasured"}
        </Tag>
      </Stack>
      <Text size="sm" color="secondary">
        {description}
      </Text>
      <Stack gap="xs">
        <ConstructEntryKicker>Shape</ConstructEntryKicker>
        <CodeBlock code={shape} language="ts" />
        {code ? <CodeBlock code={code} language="tsx" /> : null}
      </Stack>
      {blocks ? (
        <Stack gap="xs">
          <ConstructEntryKicker>Example</ConstructEntryKicker>
          <Box
            style={{
              border: "1px solid var(--rebar-color-border, #e0e0e0)",
              borderRadius: 4,
              padding: "var(--rebar-space-lg)",
              maxWidth: demoMaxWidth,
            }}
          >
            <NextBlockRenderer blocks={blocks} />
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );
}

export function ConstructEntryKicker({ children }: { children: string }) {
  return (
    <Text
      size="xs"
      color="secondary"
      style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "var(--rebar-font-weight-semibold)" }}
    >
      {children}
    </Text>
  );
}
