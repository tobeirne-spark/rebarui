import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavIndex } from "../components/NavIndex";

afterEach(cleanup);

const SHORT_ITEMS = [
  { label: "Introduction", href: "/docs" },
  { label: "Getting Started", href: "/docs/getting-started" },
];

const LONG_ITEMS = [
  { label: "All components", href: "/components" },
  { label: "Avatar", href: "/components/avatar", category: "web" },
  { label: "Button", href: "/components/button", category: "web" },
  { label: "Carousel", href: "/components/carousel", category: "web" },
  { label: "Action Sheet", href: "/components/planned/action-sheet", category: "mobile", status: "Planned" },
  { label: "Bottom Sheet", href: "/components/planned/bottom-sheet", category: "mobile", status: "Planned" },
  { label: "Gantt Chart", href: "/components/planned/gantt-chart", category: "diagram", status: "Planned" },
  { label: "d", href: "/components/d", category: "web" },
  { label: "e", href: "/components/e", category: "web" },
  { label: "f", href: "/components/f", category: "web" },
  { label: "g", href: "/components/g", category: "web" },
  { label: "h", href: "/components/h", category: "web" },
  { label: "i", href: "/components/i", category: "web" },
];

describe("NavIndex", () => {
  it("renders every item as a real link, without search/filter chrome under the threshold", () => {
    render(<NavIndex items={SHORT_ITEMS} />);
    for (const item of SHORT_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("shows search/filter chrome once the list is long enough, and keeps the un-categorized item separate", async () => {
    const user = userEvent.setup();
    render(<NavIndex items={LONG_ITEMS} categoryLabels={{ web: "Web", mobile: "Mobile", diagram: "Diagram" }} />);
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
    const categoryFilter = screen.getByRole("button", { name: "Filter by category" });
    expect(categoryFilter).toHaveTextContent("All categories");
    await user.click(categoryFilter);
    expect(await screen.findByRole("menuitemcheckbox", { name: "Mobile" })).toBeInTheDocument();
    // The un-categorized item always renders, unaffected by category/search state.
    expect(screen.getByRole("link", { name: "All components" })).toBeInTheDocument();
  });

  it("filters by search text", async () => {
    const user = userEvent.setup();
    render(<NavIndex items={LONG_ITEMS} categoryLabels={{ web: "Web", mobile: "Mobile", diagram: "Diagram" }} />);
    await user.type(screen.getByPlaceholderText("Search…"), "gantt");
    expect(screen.getByRole("link", { name: "Gantt Chart" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Avatar" })).not.toBeInTheDocument();
    // The un-categorized item is never removed by search.
    expect(screen.getByRole("link", { name: "All components" })).toBeInTheDocument();
  });

  it("filters by category via the MultiSelect checklist", async () => {
    const user = userEvent.setup();
    render(<NavIndex items={LONG_ITEMS} categoryLabels={{ web: "Web", mobile: "Mobile", diagram: "Diagram" }} />);
    await user.click(screen.getByRole("button", { name: "Filter by category" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Mobile" }));
    expect(screen.getByRole("link", { name: "Bottom Sheet" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Avatar" })).not.toBeInTheDocument();
  });

  it("shows a status tag next to an item that has one", () => {
    render(<NavIndex items={LONG_ITEMS} />);
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
  });

  it("filters by an independent status dimension alongside category (heuristic #42)", async () => {
    const user = userEvent.setup();
    render(<NavIndex items={LONG_ITEMS} unstatusedLabel="Shipped" />);
    const statusFilter = screen.getByRole("button", { name: "Filter by status" });
    expect(statusFilter).toHaveTextContent("All statuses");

    await user.click(statusFilter);
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Planned" }));
    expect(screen.getByRole("link", { name: "Gantt Chart" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Avatar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Shipped" }));
    expect(screen.getByRole("link", { name: "Avatar" })).toBeInTheDocument();
    // A real multi-select: both statuses checked at once shows the union of both, not just the
    // most-recently-picked one — the whole reason this is MultiSelect, not a SegmentedControl.
    expect(screen.getByRole("link", { name: "Gantt Chart" })).toBeInTheDocument();
  });

  it("hides the status filter entirely when every item shares the same status", () => {
    const singleStatusItems = LONG_ITEMS.map((item) => ({ ...item, status: undefined }));
    render(<NavIndex items={singleStatusItems} />);
    expect(screen.queryByRole("button", { name: "Filter by status" })).not.toBeInTheDocument();
  });

  it("hides search/filter chrome (and never shows a false 'No matches') for a long list with zero categorized items", () => {
    // The real shape of apps/docs's own /docs sidebar: more than FILTER_UI_THRESHOLD items, none
    // of them categorized — every item is "overview," so there's nothing for search/category
    // chrome to actually filter. Real bug this caught: item count alone triggered the chrome, but
    // the permanently-empty filterable set meant the search box did nothing and "No matches."
    // rendered under a fully-populated, always-shown list.
    const uncategorizedLongList = Array.from({ length: 13 }, (_, i) => ({
      label: `Doc page ${i}`,
      href: `/docs/page-${i}`,
    }));
    render(<NavIndex items={uncategorizedLongList} />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
    for (const item of uncategorizedLongList) {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
    }
  });
});
