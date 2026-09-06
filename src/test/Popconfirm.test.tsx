import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popconfirm } from "../components/Popconfirm";
import { Button } from "../components/Button";

afterEach(cleanup);

describe("Popconfirm", () => {
  it("opens the popover on trigger click, showing the title", async () => {
    const user = userEvent.setup();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByText("Delete this item?")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();
  });

  it("shows the optional description alongside the title", async () => {
    const user = userEvent.setup();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        description="This can't be undone."
        onConfirm={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it("clicking Confirm calls onConfirm and closes the popover", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete this item?")).not.toBeInTheDocument();
  });

  it("clicking Cancel calls onCancel and closes it without calling onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete this item?")).not.toBeInTheDocument();
  });

  it("supports custom confirm/cancel labels", async () => {
    const user = userEvent.setup();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        onConfirm={vi.fn()}
        confirmLabel="Delete"
        cancelLabel="Keep it"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
    // Two buttons now both named "Delete": the trigger and the confirm action.
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  it("renders the confirm button with the real destructive styling when destructive is set", async () => {
    const user = userEvent.setup();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        onConfirm={vi.fn()}
        destructive
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute(
      "data-rebar-variant",
      "destructive",
    );
  });

  it("does not render destructive styling on the confirm button by default", async () => {
    const user = userEvent.setup();
    render(
      <Popconfirm trigger={<Button>Delete</Button>} title="Delete this item?" onConfirm={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute(
      "data-rebar-variant",
      "primary",
    );
  });

  it("supports controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popconfirm
        trigger={<Button>Delete</Button>}
        title="Delete this item?"
        onConfirm={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Controlled: stays open since the caller never fed `open={false}` back in.
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();
  });
});
