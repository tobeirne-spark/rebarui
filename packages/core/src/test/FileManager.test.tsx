import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileManager } from "../components/FileManager";
import type { FileManagerNode } from "../components/FileManager";

afterEach(cleanup);

const ROOT: FileManagerNode = {
  id: "root",
  name: "Root",
  type: "folder",
  children: [
    {
      id: "docs",
      name: "Docs",
      type: "folder",
      children: [{ id: "readme", name: "readme.txt", type: "file", size: 2048 }],
    },
    { id: "photo", name: "photo.png", type: "file", size: 1024 * 1024 * 2 },
  ],
};

describe("FileManager", () => {
  it("renders the folder tree and the current folder's contents", () => {
    render(<FileManager root={ROOT} />);
    expect(screen.getByRole("tree", { name: "Folders" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Contents of Root" })).toBeInTheDocument();
    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });

  it("navigates into a folder via its open button", async () => {
    const user = userEvent.setup();
    render(<FileManager root={ROOT} />);
    await user.click(screen.getByRole("button", { name: "Open Docs" }));
    expect(screen.getByText("readme.txt")).toBeInTheDocument();
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });

  it("multi-selects via checkboxes (grid view) and shows a real delete action for the selection", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<FileManager root={ROOT} onDelete={onDelete} />);
    // Grid view uses FileManager's own per-node-labeled Checkbox; table view uses Table's own
    // generic "Select row" selection column instead — this test is about the named grid checkbox.
    await user.click(screen.getByRole("button", { name: "Grid view" }));

    await user.click(screen.getByRole("checkbox", { name: "Select Docs" }));
    await user.click(screen.getByRole("checkbox", { name: "Select photo.png" }));
    const deleteButton = screen.getByRole("button", { name: "Delete (2)" });
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(["docs", "photo"]);
  });

  it("switches between grid and table view", async () => {
    const user = userEvent.setup();
    render(<FileManager root={ROOT} />);
    // Default view is table (per the component's own composition-notes rationale).
    expect(screen.getByRole("button", { name: "Table view" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute("aria-pressed", "true");
  });

  it("drag-and-drop in grid view fires onMove, with the active-border beam on the drop target", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<FileManager root={ROOT} onMove={onMove} />);
    await user.click(screen.getByRole("button", { name: "Grid view" }));

    const dragged = screen.getByText("photo.png").closest('[data-rebar-part="item"]') as HTMLElement;
    const target = screen.getAllByText("Docs")[0]!.closest('[data-rebar-part="item"]') as HTMLElement;

    fireEvent.dragStart(dragged);
    fireEvent.dragEnter(target);
    expect(target).toHaveClass("rebar-active-border");

    fireEvent.drop(target);
    expect(onMove).toHaveBeenCalledWith(["photo"], "docs");
  });

  it("the Move to… context-menu fallback works without any drag event at all", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<FileManager root={ROOT} onMove={onMove} />);

    // Right-click must land on the actual ContextMenu-wrapped element (or a descendant of it) —
    // its own wrapper only listens on itself and below; firing on an ancestor never reaches it,
    // since DOM events bubble up from the target, never down to a target's own children.
    const nameText = screen.getByText("photo.png");
    await user.pointer({ keys: "[MouseRight]", target: nameText });
    await user.click(await screen.findByRole("menuitem", { name: "Move to…" }));

    const dialog = await screen.findByRole("dialog", { name: "Move to…" });
    await user.click(within(dialog).getByRole("treeitem", { name: /Docs/ }));
    expect(onMove).toHaveBeenCalledWith(["photo"], "docs");
  });

  it("renaming via the context menu's Rename action drives the real Editable field", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<FileManager root={ROOT} onRename={onRename} />);

    const nameText = screen.getByText("photo.png");
    await user.pointer({ keys: "[MouseRight]", target: nameText });
    await user.click(await screen.findByRole("menuitem", { name: "Rename" }));

    const input = await screen.findByDisplayValue("photo.png");
    await user.clear(input);
    await user.type(input, "new-name.png{Enter}");
    expect(onRename).toHaveBeenCalledWith("photo", "new-name.png");
  });

  it("deleting via the context menu fires onDelete with just that node's id", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<FileManager root={ROOT} onDelete={onDelete} />);

    const nameText = screen.getByText("photo.png");
    await user.pointer({ keys: "[MouseRight]", target: nameText });
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(["photo"]);
  });

  it("shows the real Empty component for an empty folder", async () => {
    const user = userEvent.setup();
    const empty: FileManagerNode = { id: "root", name: "Root", type: "folder", children: [] };
    render(<FileManager root={empty} />);
    expect(screen.getByText("This folder is empty")).toBeInTheDocument();
    void user;
  });

  it("supports controlled selectedIds", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();
    render(<FileManager root={ROOT} selectedIds={[]} onSelectedIdsChange={onSelectedIdsChange} />);
    await user.click(screen.getByRole("button", { name: "Grid view" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Docs" }));
    expect(onSelectedIdsChange).toHaveBeenCalledWith(["docs"]);
    // Controlled — caller didn't apply the change back, so the checkbox stays unchecked.
    expect(screen.getByRole("checkbox", { name: "Select Docs" })).not.toBeChecked();
  });

  it("forwards arbitrary data-*/aria-* props to the root", () => {
    render(<FileManager root={ROOT} data-testid="fm" />);
    expect(screen.getByTestId("fm")).toBeInTheDocument();
  });

  it("shows caller-supplied actions only while something is selected, and fires them with the selection", async () => {
    const user = userEvent.setup();
    const onZip = vi.fn();
    render(
      <FileManager
        root={ROOT}
        actions={[{ key: "zip", label: "Zip & download", onSelect: onZip }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Zip & download" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Grid view" }));
    await user.click(screen.getByRole("checkbox", { name: "Select photo.png" }));

    const zipButton = screen.getByRole("button", { name: "Zip & download" });
    expect(zipButton).toBeInTheDocument();
    await user.click(zipButton);
    expect(onZip).toHaveBeenCalledWith(["photo"]);
  });

  it("disables a caller-supplied action per its own disabled predicate", async () => {
    const user = userEvent.setup();
    render(
      <FileManager
        root={ROOT}
        actions={[
          {
            key: "download",
            label: "Download",
            disabled: (ids) => ids.length !== 1,
            onSelect: vi.fn(),
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Grid view" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Docs" }));
    await user.click(screen.getByRole("checkbox", { name: "Select photo.png" }));
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
  });

  it("singleFileMode hides the folder tree and the grid/table view toggle", () => {
    render(<FileManager root={ROOT} singleFileMode />);
    expect(screen.queryByRole("tree", { name: "Folders" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Grid view" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Table view" })).not.toBeInTheDocument();
  });

  it("singleFileMode replaces the selection instead of adding to it", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();
    render(<FileManager root={ROOT} singleFileMode onSelectedIdsChange={onSelectedIdsChange} />);
    await user.click(screen.getByRole("checkbox", { name: "Select Docs" }));
    await user.click(screen.getByRole("checkbox", { name: "Select photo.png" }));
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["photo"]);
  });
});
