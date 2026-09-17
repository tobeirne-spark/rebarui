import { Card, Heading, Spin, Stack, Text } from "rebar-ui";
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
        code: '<Spin />\n<Spin variant="hourglass" tip="Loading projects…" />\n<Spin variant="papers" spinning={isLoading}>\n  <ProjectList />\n</Spin>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Spin"] ?? [] },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: '`role="status"` with an `aria-label` of the `tip` text (or "Loading" if none given) — announced once by assistive tech without needing a separate live region. Wrapped content gets `aria-busy="true"` and is visually dimmed and non-interactive while spinning.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="spin"`, `data-rebar-part="content" | "overlay" | "indicator" | "tip"`. Note that `variant="classic"` always renders `.rebar-spin-icon-vector` — the other three variants only fall back to it under `[data-theme="dark"]`, since their raster art has no other way to adapt to a dark background.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "AntD's `Spin` has the same `spinning`/`tip`/children-wrapping shape and a comparable `size` union — a close, low-risk rename, not yet codemod-covered. `variant` has no AntD equivalent (AntD's own indicator isn't swappable this way) — drop it during migration, or pass a custom `indicator` element built from AntD's own icon set to keep a similar look.",
      },
    ],
  },
];

export default function SpinPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Spin</Heading>
      <Text color="secondary">
        A loading indicator — standalone, or wrapping content that dims and becomes
        non-interactive while <code>spinning</code>. Three hand-sketched icon variants, matching
        rebar&apos;s other placeholder art, plus a plain <code>classic</code> spinner for anyone
        who&apos;d rather not use the illustrated ones — not just a dark-mode fallback, a real
        selectable option in any theme.
      </Text>

      <LivePreview>
        <Stack gap="lg">
          <Stack direction="row" gap="xl" style={{ alignItems: "center" }}>
            <Stack gap="xs" style={{ alignItems: "center" }}>
              <Spin variant="drums" />
              <Text size="xs" color="secondary">
                drums (default)
              </Text>
            </Stack>
            <Stack gap="xs" style={{ alignItems: "center" }}>
              <Spin variant="hourglass" />
              <Text size="xs" color="secondary">
                hourglass
              </Text>
            </Stack>
            <Stack gap="xs" style={{ alignItems: "center" }}>
              <Spin variant="papers" />
              <Text size="xs" color="secondary">
                papers
              </Text>
            </Stack>
            <Stack gap="xs" style={{ alignItems: "center" }}>
              <Spin variant="classic" />
              <Text size="xs" color="secondary">
                classic
              </Text>
            </Stack>
            <Spin tip="Loading…" />
          </Stack>
          <Card style={{ width: 220, minHeight: 140 }}>
            <Spin spinning variant="papers" tip="Fetching">
              <Stack gap="sm">
                <Text size="sm">Project A</Text>
                <Text size="sm">Project B</Text>
                <Text size="sm">Project C</Text>
                <Text size="sm">Project D</Text>
              </Stack>
            </Spin>
          </Card>
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
