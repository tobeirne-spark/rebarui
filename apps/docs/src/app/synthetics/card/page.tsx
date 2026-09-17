import { Avatar, Button, Card, Heading, Stack, Tag, Text } from "rebar-ui";
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
        code: '<Card\n  title="Pro plan"\n  extra={<Tag tone="success">Popular</Tag>}\n  actions={[<Button key="buy" variant="primary">Subscribe</Button>]}\n>\n  $19/month, billed annually\n</Card>',
      },
      {
        kind: "code",
        code: '<Card\n  cornerBadge={<span className="priority-dot" />}\n  labels={[{ label: "Bug", tone: "error" }, { label: "P1", tone: "warning" }]}\n  title="Investigate flaky checkout test on CI"\n  titleLines={2}\n  subtitle="ENG-142"\n  footer={<><Avatar fallback="MW" placeholder /><Text size="xs">💬 3</Text></>}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["Card"] ?? [] },
  {
    type: "doc-section",
    heading: "One component, not a family of near-duplicates",
    body: [
      {
        kind: "text",
        text: 'Cards come in enough real shapes (product, pricing, profile, plain grouping, kanban) that a single rudimentary `<div>` primitive falls short — but the answer is slot props on this one component, not separate `ProductCard`/`PricingCard`/`ProfileCard`/`KanbanCard` components each reimplementing the same border/radius/zone structure. Grounded directly in the research corpus (`ref/research/component-inventories/`): Tailwind UI\'s Product Card and React Native Elements\' Pricing Card both need a `cover` image; AntD\'s `Card.Meta` and MUI\'s `CardHeader avatar` both need an `avatar` beside a title; AntD\'s `extra` and MUI\'s `CardHeader action` both need a top-right slot; AntD\'s `actions` and MUI\'s `CardActions` both need an even-split bottom row. The kanban shape (Trello, Jira, Linear, GitHub Projects, Asana) needed four more: `labels` (colored pills, real `Tag`s), `cornerBadge` (a priority flag/unread dot inset in the corner), `footer` (assignee avatar, due date, comment/attachment counts — read-only context, distinct from `actions`\' clickable buttons), and `titleLines` (clamps a title instead of letting one long one grow taller than its column neighbors).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Accessibility",
    body: [
      {
        kind: "text",
        text: "A plain, unstyled-semantics `<div>` on purpose — `Card` is a visual grouping, not an interactive or landmark role. Forwards `aria-*`/`data-*` props to its root, so a consumer adds a real role (e.g. `role=\"article\"` for a self-contained piece of content in a feed) when the surrounding context calls for one, rather than this component guessing at one.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="card"` on the root; `data-rebar-part` is `"corner-badge"`, `"cover"`, `"header"`, `"avatar"`, `"title"`, `"subtitle"`, `"extra"`, `"labels"`, `"body"`, `"footer"`, `"actions"`, or `"action"` (per item) — only the parts actually in use render, so a plain `<Card>children</Card>` with none of the new props renders exactly the single `body`-wrapped div it always did.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "A close, low-risk rename for the original four slots — `cover`/`title`/`extra`/`actions` match AntD's own `Card` prop names directly. `avatar` doesn't: AntD nests that inside `Card.Meta` instead of a top-level prop, so that one slot needs a small structural adjustment, not just a rename. Of the four kanban-card additions, checked directly against AntD's own docs rather than assumed: `labels` and `footer` have no `Card` equivalent (recompose by hand — a `Tag` row, a plain footer row) and `titleLines` has none either (a CSS `line-clamp` utility class instead); `cornerBadge` does have a real AntD counterpart, just not on `Card` itself — `Badge.Ribbon`, which wraps a card to render a corner ribbon, is the closer migration target than reinventing absolute positioning.",
      },
    ],
  },
];

export default function CardPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Card</Heading>
      <Text color="secondary">
        A bordered container with slot props for every real card shape this project has cross-
        referenced against the component-inventory research — <code>cover</code> (full-bleed
        media), <code>avatar</code>/<code>title</code>/<code>subtitle</code>/<code>extra</code>{" "}
        (header row), <code>labels</code> (a row of colored pills), <code>cornerBadge</code> (a
        small badge overlapping the top-right corner), <code>footer</code> (a compact meta row),
        and <code>actions</code> (an even-split footer row) — on top of the plain padded box every
        block in <code>@rebar-ui/placement</code> already composes internally. The last four
        (<code>labels</code>/<code>cornerBadge</code>/<code>footer</code>/<code>titleLines</code>)
        close the &quot;kanban card&quot; shape (Trello, Jira, Linear, GitHub Projects) — pills,
        a status dot, an assignee avatar and comment count, and a title that clamps instead of
        growing a fixed-width column tile without limit.
      </Text>

      <LivePreview>
        <Stack direction="row" gap="md" style={{ flexWrap: "wrap" }}>
          <Card style={{ width: 220 }}>
            <Stack gap="xs">
              <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>Plain</Text>
              <Text size="sm" color="secondary">
                Just children — no new props used, identical to before.
              </Text>
            </Stack>
          </Card>

          <Card
            style={{ width: 220 }}
            title="Pro plan"
            extra={<Tag tone="success">Popular</Tag>}
            actions={[
              <Button key="buy" variant="primary" size="sm">
                Subscribe
              </Button>,
            ]}
          >
            <Text size="sm" color="secondary">
              $19/month, billed annually
            </Text>
          </Card>

          <Card
            style={{ width: 220 }}
            avatar={<Avatar fallback="PS" placeholder />}
            title="Priya Shah"
          >
            <Text size="sm" color="secondary">
              Engineering lead
            </Text>
          </Card>

          <Card
            style={{ width: 220 }}
            cover={
              <div
                style={{
                  height: 100,
                  background: "var(--rebar-color-bg-secondary, #f5f5f5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--rebar-color-text-secondary)",
                  fontSize: "var(--rebar-font-size-xs)",
                }}
              >
                Product photo
              </div>
            }
            title="Rebar Mug"
            actions={[
              <Button key="cart" variant="secondary" size="sm">
                Add to cart
              </Button>,
            ]}
          />

          <Card
            style={{ width: 220 }}
            cornerBadge={
              <span
                aria-label="High priority"
                title="High priority"
                style={{
                  display: "block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--rebar-color-error, #c62828)",
                }}
              />
            }
            labels={[
              { label: "Bug", tone: "error" },
              { label: "P1", tone: "warning" },
            ]}
            title="Investigate flaky checkout test on CI"
            titleLines={2}
            subtitle="ENG-142"
            footer={
              <>
                <Avatar fallback="MW" placeholder />
                <Text size="xs" color="secondary">
                  💬 3
                </Text>
              </>
            }
          />
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
