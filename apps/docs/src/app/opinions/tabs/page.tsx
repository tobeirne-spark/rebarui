import { Heading, Stack, Tab, TabList, TabPanel, Tabs, Text } from "rebar-ui";
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
        code: '<Tabs defaultValue="account">\n  <TabList>\n    <Tab value="account">Account</Tab>\n    <Tab value="billing">Billing</Tab>\n  </TabList>\n  <TabPanel value="account">Account settings</TabPanel>\n  <TabPanel value="billing">Billing settings</TabPanel>\n</Tabs>',
      },
    ],
  },
  { type: "props-table", heading: "Tabs props", rows: componentProps["Tabs"] ?? [] },
  { type: "props-table", heading: "Tab props", rows: componentProps["Tab"] ?? [] },
  {
    type: "doc-section",
    heading: "Four thin Radix wrappers",
    body: [
      {
        kind: "text",
        text: '`Tabs` (the root, `value`/`defaultValue`/`onValueChange`), `TabList` (the row of triggers), `Tab` (one trigger — a real, keyboard-arrow-navigable button), `TabPanel` (the content shown for the matching `value`, unmounted by default when inactive). This exact structure is what `CapsuleTabs`-style patterns and `FileManager`\'s own view-mode switching compose from.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Jumbo tabs (antd-mobile's JumboTabs)",
    body: [
      {
        kind: "text",
        text: '`TabList`\'s `size="jumbo"` renders bigger, more prominent tab buttons with room for each `Tab`\'s own optional `description` — antd-mobile\'s `JumboTabs`, ported as a size rather than a second component since its own docs describe it as "very similar to Tabs" with no real behavior difference.',
      },
      {
        kind: "code",
        code: '<TabList size="jumbo">\n  <Tab value="popular" description="Trending this week">Popular</Tab>\n  <Tab value="new" description="Just added">New</Tab>\n</TabList>',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      { kind: "text", text: '`data-rebar-component="tabs"` on the root; `data-rebar-part="list"` on `TabList`, `"tab"` on each `Tab`.' },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      { kind: "text", text: 'AntD\'s `Tabs` takes an `items` array (`{ key, label, children }`) rather than JSX children — a real, mechanical restructuring, not a straight prop rename.' },
    ],
  },
];

export default function TabsPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Tabs</Heading>
      <Text color="secondary">
        A real Radix tabs component — four small pieces: <code>Tabs</code>, <code>TabList</code>,{" "}
        <code>Tab</code>, <code>TabPanel</code>.
      </Text>

      <LivePreview>
        <Tabs defaultValue="account" style={{ maxWidth: 420 }}>
          <TabList>
            <Tab value="account">Account</Tab>
            <Tab value="billing">Billing</Tab>
          </TabList>
          <TabPanel value="account">
            <Text size="sm">Account settings go here.</Text>
          </TabPanel>
          <TabPanel value="billing">
            <Text size="sm">Billing settings go here.</Text>
          </TabPanel>
        </Tabs>

        <Tabs defaultValue="popular" style={{ maxWidth: 420, marginTop: "var(--rebar-space-lg)" }}>
          <TabList size="jumbo">
            <Tab value="popular" description="Trending this week">
              Popular
            </Tab>
            <Tab value="new" description="Just added">
              New
            </Tab>
          </TabList>
          <TabPanel value="popular">
            <Text size="sm">Popular items go here.</Text>
          </TabPanel>
          <TabPanel value="new">
            <Text size="sm">New items go here.</Text>
          </TabPanel>
        </Tabs>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
