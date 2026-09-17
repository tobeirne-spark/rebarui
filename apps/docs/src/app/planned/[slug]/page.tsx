import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Heading, Stack, Tag, Text } from "rebar-ui";
import { CATALOG_BY_SLUG, CATALOG_CONSTRUCTS } from "@/data/constructCatalog";

const CATEGORY_LABEL: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  diagram: "Diagram",
};

// A static export (`output: "export"`, see next.config.ts) needs at least one generated param for
// a dynamic route, even when the catalog this page reads from is empty — which it genuinely is
// right now: every component ever catalogued as a planned gap has since shipped as a real
// `packages/core` component (see constructCatalog.web.ts/.mobile.ts/.diagrams.ts's own comments).
// Rather than delete this route (the catalog is a living tracker, expected to gain new entries
// again whenever the next real gap is found), a single placeholder slug keeps the route — and the
// exact same code path a future real entry will use — alive, rendering a plain "nothing planned
// right now" message instead of a 404.
const EMPTY_CATALOG_PLACEHOLDER_SLUG = "_none";

export function generateStaticParams() {
  if (CATALOG_CONSTRUCTS.length === 0) {
    return [{ slug: EMPTY_CATALOG_PLACEHOLDER_SLUG }];
  }
  return CATALOG_CONSTRUCTS.map((c) => ({ slug: c.slug }));
}

export default async function PlannedComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === EMPTY_CATALOG_PLACEHOLDER_SLUG && CATALOG_CONSTRUCTS.length === 0) {
    return (
      <Stack gap="lg">
        <Heading level={1}>Nothing planned right now</Heading>
        <Card>
          <Stack gap="sm">
            <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
              Every catalogued gap has shipped
            </Text>
            <Text color="secondary">
              This page normally lists a component identified as a gap — cross-referencing 180+
              published UI libraries and design systems against rebar-ui's current set — but not
              yet built. Right now that list is empty: every component this project ever
              catalogued this way has since shipped as a real component. Check{" "}
              <Link href="/about/agent" className="rebar-link">
                the four tiers
              </Link>{" "}
              for what's actually available.
            </Text>
          </Stack>
        </Card>
        <Link href="/about/agent" className="rebar-link">
          ← Back to the four tiers
        </Link>
      </Stack>
    );
  }

  const entry = CATALOG_BY_SLUG.get(slug);
  if (!entry) notFound();

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Stack direction="row" gap="xs">
          <Tag>{CATEGORY_LABEL[entry.category]}</Tag>
          <Tag tone="warning">Planned</Tag>
        </Stack>
        <Heading level={1}>{entry.name}</Heading>
      </Stack>

      <Card>
        <Stack gap="sm">
          <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>Not yet built</Text>
          <Text color="secondary">
            This isn&apos;t a shipped <code>rebar-ui</code> component — it&apos;s a cataloged gap,
            surfaced by cross-referencing 180+ published UI libraries and design systems against
            rebar-ui&apos;s current component set. Recorded here so it&apos;s tracked and
            de-duplicated, not lost in a research file — not a roadmap commitment or a timeline.
          </Text>
        </Stack>
      </Card>

      <Stack gap="xs">
        <Heading level={2}>What it is</Heading>
        <Text color="secondary">{entry.description}</Text>
      </Stack>

      {entry.note ? (
        <Stack gap="xs">
          <Heading level={2}>Caveat</Heading>
          <Text color="secondary">{entry.note}</Text>
        </Stack>
      ) : null}

      <Stack gap="xs">
        <Heading level={2}>Seen in</Heading>
        <Text color="secondary">{entry.sources.join(", ")}</Text>
      </Stack>

      <Link href="/about/agent" className="rebar-link">
        ← Back to the four tiers
      </Link>
    </Stack>
  );
}
