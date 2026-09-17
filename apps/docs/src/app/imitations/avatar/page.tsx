import { Avatar, Box, Card, Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const PORTRAIT_COUNT = 30;

const CODE_AND_PROPS_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: `<Avatar fallback="AL" />\n<Avatar fallback="Ada Lovelace" src="/photos/ada.jpg" />\n<Avatar fallback="Ada Lovelace" placeholder />\n<Avatar fallback="Ada Lovelace" placeholder={2} />`,
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Avatar"] ?? [] },
];

const CLOSING_BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "The fallback text (initials) is always in the DOM as real text, readable by screen readers even before/if the image never loads. Pass a meaningful `alt` when using a real `src`; when only `fallback` or `placeholder` is set, the image is decorative and `alt` is left empty automatically.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="avatar"` on the root; `data-rebar-part="fallback"` on the initials element.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's `Avatar` takes its fallback content as `children`, while Rebar's is the `fallback` prop, a prop-to-children structural move a codemod won't attempt (see the antd adapter's README). `placeholder` has no AntD equivalent at all — AntD has no built-in illustrated-portrait fallback — so migrating a placeholder-using Avatar means supplying a real `src` (or dropping back to plain initials via `children`), not a mechanical rename.",
      },
    ],
  },
];

export default function AvatarPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Avatar</Heading>
      <Text color="secondary">
        A circular image with a text fallback (Radix underneath). Plain initials by default —
        Rebar stays low-fidelity until you supply a real <code>src</code>. Set{" "}
        <code>placeholder</code> to show one of Rebar&apos;s built-in illustrated portraits
        instead of bare initials while you don&apos;t have a real photo yet.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <Stack gap="xs" style={{ alignItems: "center" }}>
            <Avatar fallback="AL" />
            <Text size="xs" color="secondary">
              default
            </Text>
          </Stack>
          <Stack gap="xs" style={{ alignItems: "center" }}>
            <Avatar fallback="Ada Lovelace" placeholder />
            <Text size="xs" color="secondary">
              placeholder
            </Text>
          </Stack>
          <Stack gap="xs" style={{ alignItems: "center" }}>
            <Avatar fallback="Grace Hopper" placeholder />
            <Text size="xs" color="secondary">
              placeholder
            </Text>
          </Stack>
          <Stack gap="xs" style={{ alignItems: "center" }}>
            <Avatar fallback="Katherine Johnson" placeholder />
            <Text size="xs" color="secondary">
              placeholder
            </Text>
          </Stack>
          <Stack gap="xs" style={{ alignItems: "center" }}>
            <Avatar fallback="Margaret Hamilton" placeholder />
            <Text size="xs" color="secondary">
              placeholder
            </Text>
          </Stack>
        </Stack>
      </LivePreview>
      <Text size="xs" color="secondary">
        Each name above always gets the same portrait — <code>placeholder</code> picks
        deterministically from <code>fallback</code>, not randomly, so a given person&apos;s
        avatar doesn&apos;t change between renders.
      </Text>

      <Stack gap="sm">
        <Heading level={2}>The full portrait set</Heading>
        <Text size="sm" color="secondary">
          All {PORTRAIT_COUNT} illustrated portraits, shown deliberately across a range of ages and
          ethnicities so the built-in default doesn&apos;t default to one look. Pass{" "}
          <code>placeholder={"{"}n{"}"}</code> with a specific index to pick one directly instead of
          relying on the name hash. Shown as a plain grid, not a <code>Carousel</code> — this is a
          reference gallery meant to be scanned all at once (the same exception the
          space-dense-content heuristic itself carves out for a dedicated gallery page — see
          ref/HEURISTICS.md #49), not a one-at-a-time browsing experience.
        </Text>
        <LivePreview>
          <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }} aria-label="All illustrated portraits">
            {Array.from({ length: PORTRAIT_COUNT }, (_, i) => (
              <Stack key={i} gap="xs" style={{ alignItems: "center" }}>
                <Avatar fallback={String(i)} placeholder={i} />
                <Text size="xs" color="secondary">
                  placeholder={"{"}
                  {i}
                  {"}"}
                </Text>
              </Stack>
            ))}
          </Stack>
        </LivePreview>
      </Stack>

      <NextBlockRenderer blocks={CODE_AND_PROPS_BLOCKS} />

      <Stack gap="sm">
        <Heading level={2}>Composition: a profile card</Heading>
        <Text size="sm" color="secondary">
          Avatar composes with <code>Card</code> like anything else in Rebar — no special "media"
          component needed. This also demonstrates the other half of the placeholder art set: the
          same style, at wider aspect ratios, for whatever a card needs a real image for later.
        </Text>
        <LivePreview>
          <Card style={{ maxWidth: 360, margin: "0 auto" }}>
            <Stack gap="md">
              <Stack direction="row" gap="sm" align="center">
                <Avatar fallback="Grace Hopper" placeholder />
                <Stack gap="xs">
                  <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
                    Grace Hopper
                  </Text>
                  <Text size="xs" color="secondary">
                    Rear Admiral, USN
                  </Text>
                </Stack>
              </Stack>
              <Box style={{ borderRadius: 4, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/placeholders/4-3-ratio-2.jpg"
                  alt=""
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Box>
            </Stack>
          </Card>
        </LivePreview>
      </Stack>
    </Stack>
  );
}
