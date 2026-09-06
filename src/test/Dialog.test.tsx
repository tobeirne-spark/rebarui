import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "../components/Dialog";
import { Button } from "../components/Button";

afterEach(() => {
  vi.useRealTimers();
});

describe("Dialog", () => {
  it("renders with an accessible role and the given title", () => {
    render(
      <Dialog open title="Confirm delete">
        Are you sure?
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Confirm delete" });
    expect(dialog).toHaveAttribute("data-rebar-component", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("opens via its trigger and closes on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          trigger={<Button>Open</Button>}
          title="Confirm delete"
        >
          Are you sure?
        </Dialog>
      );
    }

    render(<Controlled />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Confirm delete" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("has a labeled close button that fires onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Confirm delete">
        Are you sure?
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("right-aligns footer actions in a dedicated data-rebar-part", () => {
    render(
      <Dialog
        open
        title="Confirm delete"
        footer={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </>
        }
      >
        Are you sure?
      </Dialog>,
    );
    const footer = screen.getByRole("button", { name: "Delete" }).closest(
      '[data-rebar-part="footer"]',
    );
    expect(footer).not.toBeNull();
  });

  it("adds the active-border class when set", () => {
    render(
      <Dialog open activeBorder title="Drop here">
        Content
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("rebar-active-border");
  });

  it("adds the fullscreen classes when set", () => {
    render(
      <Dialog open fullscreen title="Preview">
        Content
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("rebar-dialog-content-fullscreen");
    expect(document.querySelector('[data-rebar-part="overlay"]')).toHaveClass("rebar-dialog-overlay-fullscreen");
  });

  it("closes itself after autoDismiss milliseconds, uncontrolled", async () => {
    render(
      <Dialog defaultOpen autoDismiss={50} title="Saved">
        Your change was saved.
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 1000 });
  });

  it("closes itself after autoDismiss milliseconds, controlled — calling the caller's onOpenChange", async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          autoDismiss={50}
          title="Saved"
        >
          Your change was saved.
        </Dialog>
      );
    }
    render(<Controlled />);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false), { timeout: 1000 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
