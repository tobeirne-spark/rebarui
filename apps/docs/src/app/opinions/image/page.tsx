"use client";

import { useState } from "react";
import { Button, Heading, Image, Stack, Text } from "rebar-ui";
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
        code: '<Image src="/photo.jpg" alt="A mountain lake at sunrise" width={240} height={160} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Image"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from AspectRatio",
    body: [
      {
        kind: "text",
        text: "`AspectRatio` handles ratio/placeholder/watermark framing, but has no concept of \"is this still loading\" or \"did this 404\" — `Image` is the complement: a real load/error state machine around a plain `<img>`, per ref/HEURISTICS.md #20 (loading, error, empty, and disabled states are all designed, not just the happy path). The `<img>` itself is always rendered (never conditionally unmounted) once a real `src` is given, so its `alt` text stays in the accessibility tree through every state — the loading indicator and error fallback are overlays on top of it, not replacements for it.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "empty vs. error: two different problems",
    body: [
      {
        kind: "text",
        text: 'Omitting `src` entirely (or passing `""`) renders a distinct `empty` state — "there\'s nothing here yet," e.g. a gallery slot before an upload — instead of falling through to the `error` fallback. These are genuinely different claims: `error` means a real `src` was given and it failed to load; `empty` means no `src` was ever supplied. No real `<img>` is rendered at all in the `empty` state, since there\'s no source to attempt loading. Also fixed alongside this: the default error fallback used to render the `alt` text as its own visible message, which meant a caller\'s own content description (what the image *depicts*) could leak through looking like an error message. The default fallback now shows a fixed, generic "Image failed to load" instead — `alt` stays reserved for describing content, not failure.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="image"` on the root, which also carries `data-rebar-image-status="empty"|"loading"|"loaded"|"error"`; parts: `img`, `loading`, `fallback`, `empty`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's own `Image` is a close structural match for the loading/error states — `src`/`alt`/`fallback` map directly. AntD's `Image` also bundles a built-in fullscreen preview; this project keeps that as a separate `Lightbox` component instead of merging the two concerns.",
      },
    ],
  },
];

export default function ImagePage() {
  const [key, setKey] = useState(0);

  return (
    <Stack gap="lg">
      <Heading level={1}>Image</Heading>
      <Text color="secondary">
        A real <code>&lt;img&gt;</code> wrapper with loading and error states — a spinner while it
        loads, a real fallback if the source fails.
      </Text>

      <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            A working image
          </Text>
          <Image
            key={`ok-${key}`}
            src="https://picsum.photos/240/160"
            alt="A random placeholder photo"
            width={240}
            height={160}
          />
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            A broken source (real error state)
          </Text>
          <Image
            key={`broken-${key}`}
            src="https://example.invalid/does-not-exist.jpg"
            alt="A demo photo with a deliberately broken source"
            width={240}
            height={160}
          />
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            No source at all (empty state)
          </Text>
          <Image alt="Profile photo, not yet uploaded" width={240} height={160} />
        </Stack>
      </Stack>
      <Button variant="secondary" onClick={() => setKey((k) => k + 1)} style={{ maxWidth: 200 }}>
        Reload both (see loading state)
      </Button>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
