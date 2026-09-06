import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShapeGallery } from "../components/ShapeGallery";
import type { ShapeGalleryItem } from "../components/ShapeGallery";

const items: ShapeGalleryItem[] = [
  { id: "circle", label: "Circle", category: "Basic", preview: <svg data-testid="preview-circle" /> },
  { id: "square", label: "Square", category: "Basic", preview: <svg data-testid="preview-square" /> },
  { id: "decision", label: "Decision Diamond", category: "Flowchart", preview: <svg data-testid="preview-decision" /> },
  { id: "arrow", label: "Arrow Icon", category: "Icons", preview: <svg data-testid="preview-arrow" /> },
];

async function openCategoryTab(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("tab", { name }));
}

describe("ShapeGallery", () => {
  it("filters items by label, case-insensitively, live as you type", async () => {
    const user = userEvent.setup();
    render(<ShapeGallery items={items} onSelect={vi.fn()} />);

    await openCategoryTab(user, "Basic");
    expect(screen.getByRole("button", { name: "Circle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Square" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search shapes..."), "CIR");

    expect(screen.getByRole("button", { name: "Circle" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Square" })).not.toBeInTheDocument();
  });

  it("shows only the active category's items under its tab", async () => {
    const user = userEvent.setup();
    render(<ShapeGallery items={items} onSelect={vi.fn()} />);

    await openCategoryTab(user, "Basic");
    expect(screen.getByRole("button", { name: "Circle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Square" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decision Diamond" })).not.toBeInTheDocument();

    await openCategoryTab(user, "Flowchart");
    expect(screen.getByRole("button", { name: "Decision Diamond" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Circle" })).not.toBeInTheDocument();
  });

  it("shows only favorited items under the synthetic Favorites tab", () => {
    render(<ShapeGallery items={items} defaultFavoriteIds={["circle"]} onSelect={vi.fn()} />);

    // Favorites is the default active tab.
    expect(screen.getByRole("button", { name: "Circle" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Square" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decision Diamond" })).not.toBeInTheDocument();
  });

  it("shows a friendly empty state on the Favorites tab when nothing is favorited yet", () => {
    render(<ShapeGallery items={items} onSelect={vi.fn()} />);

    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
  });

  it("toggles favorite status by clicking the star, without calling onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onFavoriteIdsChange = vi.fn();
    render(
      <ShapeGallery items={items} onSelect={onSelect} onFavoriteIdsChange={onFavoriteIdsChange} />,
    );

    await openCategoryTab(user, "Basic");
    const circleSwatch = screen.getByRole("button", { name: "Circle" });
    const favoriteToggle = within(circleSwatch).getByRole("button", { name: "Add Circle to favorites" });

    await user.click(favoriteToggle);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onFavoriteIdsChange).toHaveBeenCalledWith(["circle"]);
    expect(within(circleSwatch).getByRole("button", { name: "Remove Circle from favorites" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onSelect with the item when the swatch itself is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ShapeGallery items={items} onSelect={onSelect} />);

    await openCategoryTab(user, "Basic");
    await user.click(screen.getByRole("button", { name: "Circle" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it("moves focus across the grid with roving-tabindex arrow-key navigation", async () => {
    const user = userEvent.setup();
    render(<ShapeGallery items={items} onSelect={vi.fn()} />);

    await openCategoryTab(user, "Basic");
    const circleSwatch = screen.getByRole("button", { name: "Circle" });
    const squareSwatch = screen.getByRole("button", { name: "Square" });

    // Only the first swatch starts in the roving tab order.
    expect(circleSwatch).toHaveAttribute("tabIndex", "0");
    expect(squareSwatch).toHaveAttribute("tabIndex", "-1");

    circleSwatch.focus();
    expect(circleSwatch).toHaveFocus();

    fireEvent.keyDown(circleSwatch, { key: "ArrowRight" });

    expect(squareSwatch).toHaveFocus();
    expect(squareSwatch).toHaveAttribute("tabIndex", "0");
    expect(circleSwatch).toHaveAttribute("tabIndex", "-1");

    fireEvent.keyDown(squareSwatch, { key: "ArrowLeft" });
    expect(circleSwatch).toHaveFocus();

    fireEvent.keyDown(circleSwatch, { key: "End" });
    expect(squareSwatch).toHaveFocus();

    fireEvent.keyDown(squareSwatch, { key: "Home" });
    expect(circleSwatch).toHaveFocus();
  });

  it("selects the focused swatch on Enter/Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ShapeGallery items={items} onSelect={onSelect} />);

    await openCategoryTab(user, "Basic");
    const circleSwatch = screen.getByRole("button", { name: "Circle" });
    circleSwatch.focus();

    fireEvent.keyDown(circleSwatch, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(items[0]);

    fireEvent.keyDown(circleSwatch, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("shows a 'No shapes found' message when the search matches nothing", async () => {
    const user = userEvent.setup();
    render(<ShapeGallery items={items} onSelect={vi.fn()} />);

    await openCategoryTab(user, "Basic");
    await user.type(screen.getByPlaceholderText("Search shapes..."), "zzz-no-match");

    expect(screen.getByText("No shapes found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Circle" })).not.toBeInTheDocument();
  });
});
