import { CodeBlock, Heading, Image, Stack, Tag, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { HAS_FULL_PAGE } from "@/data/hasFullPage";
import { shippedCategory } from "@/data/shippedCategory";
import { tierComponentNames } from "@/data/tierSections";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const CATEGORY_LABEL = { web: "Web", mobile: "Mobile", diagram: "Diagram" } as const;
const CATEGORY_TONE = { web: "info", mobile: "success", diagram: "warning" } as const;

export default function OrdersPage() {
  const names = tierComponentNames("order");

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
      <Image src="/catalogue-heros/orders.jpeg" alt="Orders hero image" style={{ width: "100%", borderRadius: "8px" }} />
      <Heading level={1}>Orders</Heading>
      <Text color="secondary">
        Macro/page-level structural governance — components and blocks that arrange other things
        at a page or app scale (nav bars, sidebars, tab strips that swap whole panels, page-level
        overlay/panel systems, page indexes) rather than carrying their own data-shaped state. Read
        literally, Order looks like a fourth rung of the same Imitation→Synthetic→Opinion
        complexity ladder; it isn&apos;t — it&apos;s a different axis (macro governance vs.
        behavioral complexity), which is why it covers only 8 of the 39 blocks rather than the
        whole placement layer. See{" "}
        <a href="/about/agent" className="rebar-link">
          the four tiers
        </a>{" "}
        for the full nuance.
      </Text>

      <Heading level={2}>Components ({names.length})</Heading>
      <NextBlockRenderer blocks={[grid]} />
    </Stack>
  );
}
