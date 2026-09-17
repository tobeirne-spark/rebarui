import { Heading, Image, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { HAS_FULL_PAGE } from "@/data/hasFullPage";
import { shippedCategory } from "@/data/shippedCategory";
import { tierComponentNames } from "@/data/tierSections";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const CATEGORY_LABEL = { web: "Web", mobile: "Mobile", diagram: "Diagram" } as const;
const CATEGORY_TONE = { web: "info", mobile: "success", diagram: "warning" } as const;

export default function SyntheticsPage() {
  const names = tierComponentNames("synthetic");

  const grid: Construct = {
    type: "card-grid",
    items: names.map((name) => {
      const href = HAS_FULL_PAGE[name];
      const category = shippedCategory(name);
      return { title: name, href, linkLabel: "View reference →", tags: [{ label: CATEGORY_LABEL[category], tone: CATEGORY_TONE[category] }] };
    }),
  };

  return (
    <Stack gap="lg">
      <Image src="/catalogue-heros/synthetics.jpeg" alt="Synthetics hero image" style={{ width: "100%", borderRadius: "8px" }} />
      <Heading level={1}>Synthetics</Heading>
      <Text color="secondary">
        Static compositions/groupings of primitives with a unified purpose, but still no real
        dynamism — a fixed layout, not a state machine. Most placement-layer blocks land here:
        plain content shapes with nothing bound to live data or a handler. See{" "}
        <a href="/about/agent" className="rebar-link">
          the four tiers
        </a>{" "}
        for how this relates to Imitations, Opinions, and Orders.
      </Text>

      <Heading level={2}>Components ({names.length})</Heading>
      <NextBlockRenderer blocks={[grid]} />
    </Stack>
  );
}
