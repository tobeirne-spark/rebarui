"use client";

import { useState } from "react";
import { Card, Heading, InfiniteScrollGrid, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

interface Person {
  id: string;
  name: string;
}

const ALL_PEOPLE: Person[] = Array.from({ length: 60 }, (_, i) => ({
  id: `p${i}`,
  name: `Person ${i + 1}`,
}));

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<InfiniteScrollGrid\n  items={items}\n  renderItem={(item) => <Card>{item.name}</Card>}\n  keyExtractor={(item) => item.id}\n  hasMore={hasMore}\n  isLoading={isLoading}\n  onLoadMore={loadNextPage}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["InfiniteScrollGrid"] ?? [] },
  {
    type: "doc-section",
    heading: "A real IntersectionObserver, not scroll-position math",
    body: [
      {
        kind: "text",
        text: "A sentinel element near the bottom triggers `onLoadMore` via IntersectionObserver — the caller owns all data fetching, this component performs no networking itself. Shows real `Skeleton` placeholders while loading, and collapses to fewer columns automatically on a narrow viewport.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="infinite-scroll-grid"`; parts include `item`, `skeleton`, and `sentinel`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD's own `List` supports `loadMore` but via a manual button, not scroll-triggered; compose `List` + a hand-rolled IntersectionObserver, or a dedicated infinite-scroll library.",
      },
    ],
  },
];

export default function InfiniteScrollGridPage() {
  const [visibleCount, setVisibleCount] = useState(9);
  const [isLoading, setIsLoading] = useState(false);
  const items = ALL_PEOPLE.slice(0, visibleCount);
  const hasMore = visibleCount < ALL_PEOPLE.length;

  const loadMore = () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((v) => Math.min(v + 9, ALL_PEOPLE.length));
      setIsLoading(false);
    }, 600);
  };

  return (
    <Stack gap="lg">
      <Heading level={1}>InfiniteScrollGrid</Heading>
      <Text color="secondary">
        A card grid that loads more via real scroll-position detection, not page numbers.
      </Text>

      <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid var(--rebar-color-border)", borderRadius: 4, padding: 16 }}>
        <InfiniteScrollGrid
          items={items}
          renderItem={(item) => (
            <Card>
              <Text>{item.name}</Text>
            </Card>
          )}
          keyExtractor={(item) => item.id}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          columns={3}
        />
      </div>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
