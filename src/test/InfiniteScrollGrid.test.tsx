import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { InfiniteScrollGrid } from "../components/InfiniteScrollGrid";

afterEach(cleanup);

interface Item {
  id: string;
  label: string;
}

function makeItems(count: number, offset = 0): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${offset + i}`,
    label: `Item ${offset + i}`,
  }));
}

// Same mocking pattern already established in SectionNav.test.tsx: a capturing
// IntersectionObserver stub that records every instance created and exposes a `fire()` helper so
// a test can manually simulate the sentinel crossing the visibility threshold, since jsdom has no
// real IntersectionObserver implementation.
class CapturingIntersectionObserver {
  static instances: CapturingIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    CapturingIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  fire(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

beforeEach(() => {
  CapturingIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", CapturingIntersectionObserver);
});

describe("InfiniteScrollGrid", () => {
  it("renders every item via renderItem, keyed by keyExtractor", () => {
    const items = makeItems(3);
    render(
      <InfiniteScrollGrid
        items={items}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => {}}
      />,
    );
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-rebar-part="item"]')).toHaveLength(3);
  });

  it("carries the rebar-component marker on its root", () => {
    render(
      <InfiniteScrollGrid
        items={makeItems(1)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => {}}
      />,
    );
    expect(
      document.querySelector('[data-rebar-component="infinite-scroll-grid"]'),
    ).not.toBeNull();
  });

  it("shows skeletonCount real Skeleton placeholders while isLoading, appended after the real items", () => {
    render(
      <InfiniteScrollGrid
        items={makeItems(2)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={true}
        skeletonCount={4}
        onLoadMore={() => {}}
      />,
    );
    const skeletonSlots = document.querySelectorAll('[data-rebar-part="skeleton"]');
    expect(skeletonSlots).toHaveLength(4);
    skeletonSlots.forEach((slot) => {
      expect(slot.querySelectorAll('[data-rebar-component="skeleton"]').length).toBeGreaterThan(0);
    });
    // Real items still render alongside the skeletons, in the same grid.
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("defaults skeletonCount to columns when not given", () => {
    render(
      <InfiniteScrollGrid
        items={[]}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={true}
        columns={5}
        onLoadMore={() => {}}
      />,
    );
    expect(document.querySelectorAll('[data-rebar-part="skeleton"]')).toHaveLength(5);
  });

  it("fires onLoadMore once the sentinel becomes visible", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );
    expect(document.querySelector('[data-rebar-part="sentinel"]')).not.toBeNull();
    const observer = CapturingIntersectionObserver.instances[0]!;
    act(() => {
      observer.fire(true);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not re-fire onLoadMore repeatedly while the sentinel stays intersecting", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );
    const observer = CapturingIntersectionObserver.instances[0]!;
    act(() => {
      observer.fire(true);
      observer.fire(true);
      observer.fire(true);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not fire onLoadMore while a load is already in flight, even if the sentinel intersects", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={true}
        onLoadMore={onLoadMore}
      />,
    );
    const observer = CapturingIntersectionObserver.instances[0]!;
    act(() => {
      observer.fire(true);
    });
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("fires again after leaving and re-entering view once loading has resolved", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );
    const observer = CapturingIntersectionObserver.instances[0]!;
    act(() => {
      observer.fire(true);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // Sentinel scrolls back out of view (new items pushed it down) then back into view again —
    // a genuinely new approach-to-bottom, so it should fire again.
    act(() => {
      observer.fire(false);
      observer.fire(true);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it("resets the guard once items/hasMore change, retrying immediately if still intersecting", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );
    const observer = CapturingIntersectionObserver.instances[0]!;
    act(() => {
      observer.fire(true);
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // Simulate the fetch resolving with more items appended, sentinel still intersecting (tall
    // viewport case) — a real new page of data is a legitimate reason to ask for the next one
    // right away, without needing the sentinel to leave and re-enter view first.
    act(() => {
      rerender(
        <InfiniteScrollGrid
          items={makeItems(6)}
          renderItem={(item: Item) => <span>{item.label}</span>}
          keyExtractor={(item: Item) => item.id}
          hasMore={true}
          isLoading={false}
          onLoadMore={onLoadMore}
        />,
      );
    });
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it("renders the shared Empty component when items is empty and not loading", () => {
    render(
      <InfiniteScrollGrid
        items={[]}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={false}
        isLoading={false}
        emptyMessage="Nothing here yet"
        onLoadMore={() => {}}
      />,
    );
    expect(document.querySelector('[data-rebar-component="empty"]')).not.toBeNull();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("does not render Empty while a first load is still in flight", () => {
    render(
      <InfiniteScrollGrid
        items={[]}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={true}
        onLoadMore={() => {}}
      />,
    );
    expect(document.querySelector('[data-rebar-component="empty"]')).toBeNull();
  });

  it('shows a "reached the end" caption once hasMore is false, with no sentinel or skeletons', () => {
    render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => {}}
      />,
    );
    expect(screen.getByText(/reached the end/i)).toBeInTheDocument();
    expect(document.querySelector('[data-rebar-part="sentinel"]')).toBeNull();
    expect(document.querySelectorAll('[data-rebar-part="skeleton"]')).toHaveLength(0);
  });

  it('shows no "reached the end" caption while hasMore is true', () => {
    render(
      <InfiniteScrollGrid
        items={makeItems(3)}
        renderItem={(item: Item) => <span>{item.label}</span>}
        keyExtractor={(item: Item) => item.id}
        hasMore={true}
        isLoading={false}
        onLoadMore={() => {}}
      />,
    );
    expect(screen.queryByText(/reached the end/i)).not.toBeInTheDocument();
  });
});
