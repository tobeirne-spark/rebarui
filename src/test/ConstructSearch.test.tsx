import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConstructSearch } from "../components/ConstructSearch";
import type { ConstructSearchResult } from "../components/ConstructSearch";

afterEach(cleanup);

const RESULTS: ConstructSearchResult[] = [
  { name: "Kanban", group: "Opinions", href: "/opinions/kanban" },
  { name: "Card Kanban", group: "Opinions", href: "/opinions#card-kanban" },
  { name: "Steps", group: "Synthetics", href: "/synthetics/steps" },
];

describe("ConstructSearch", () => {
  it("renders no dropdown when the query is empty", () => {
    render(<ConstructSearch results={RESULTS} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters results by substring match as the user types, case-insensitively", async () => {
    const user = userEvent.setup();
    render(<ConstructSearch results={RESULTS} />);
    const input = screen.getByRole("combobox", { name: "Search constructs" });
    await user.type(input, "KAN");
    expect(screen.getByRole("option", { name: "Kanban" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Card Kanban" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Steps" })).not.toBeInTheDocument();
  });

  it("renders results grouped, with a header for each group", async () => {
    const user = userEvent.setup();
    const grouped: ConstructSearchResult[] = [
      { name: "Alpha", group: "Opinions", href: "/o/alpha" },
      { name: "Alpine", group: "Synthetics", href: "/s/alpine" },
    ];
    render(<ConstructSearch results={grouped} />);
    await user.type(screen.getByRole("combobox"), "al");
    expect(screen.getByText("Opinions")).toBeInTheDocument();
    expect(screen.getByText("Synthetics")).toBeInTheDocument();
  });

  it("caps rendered results at maxResults", async () => {
    const user = userEvent.setup();
    const many: ConstructSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
      name: `Item ${i}`,
      href: `/x/${i}`,
    }));
    render(<ConstructSearch results={many} maxResults={3} />);
    await user.type(screen.getByRole("combobox"), "item");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("moves the highlighted item with ArrowDown/ArrowUp, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<ConstructSearch results={RESULTS} />);
    await user.type(screen.getByRole("combobox"), "a");

    expect(screen.getByRole("option", { name: "Kanban" })).toHaveAttribute("aria-selected", "false");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Kanban" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Card Kanban" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: "Kanban" })).toHaveAttribute("aria-selected", "true");
  });

  it("navigates to the highlighted result's href on Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ConstructSearch
        results={RESULTS}
        renderLink={({ href, children, className }) => (
          <a href={href} className={className} onClick={onClick}>
            {children}
          </a>
        )}
      />,
    );
    await user.type(screen.getByRole("combobox"), "kanban");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("closes and clears the query on Escape", async () => {
    const user = userEvent.setup();
    render(<ConstructSearch results={RESULTS} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "kan");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows a real empty state when no result matches the query", async () => {
    const user = userEvent.setup();
    render(<ConstructSearch results={RESULTS} />);
    await user.type(screen.getByRole("combobox"), "zzzzz");
    expect(screen.getByText("No matching constructs")).toBeInTheDocument();
  });
});
