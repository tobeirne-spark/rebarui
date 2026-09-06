import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropdown } from "../components/Dropdown";
import { Button } from "../components/Button";

describe("Dropdown", () => {
  it("opens on trigger click and shows real menuitem roles", async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        trigger={<Button>Actions</Button>}
        items={[
          { key: "edit", label: "Edit" },
          { key: "delete", label: "Delete", danger: true },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls the item's onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Dropdown trigger={<Button>Actions</Button>} items={[{ key: "edit", label: "Edit", onSelect }]} />,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marks a danger item with data-rebar-danger", async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        trigger={<Button>Actions</Button>}
        items={[{ key: "delete", label: "Delete", danger: true }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const item = await screen.findByRole("menuitem", { name: "Delete" });
    expect(item).toHaveAttribute("data-rebar-danger");
  });
});
