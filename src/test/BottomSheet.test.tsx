import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";

describe("BottomSheet", () => {
  it("renders as a drawer fixed to the bottom, with its own data-rebar-component", () => {
    render(
      <BottomSheet open title="Share">
        Sharing options
      </BottomSheet>,
    );
    const sheet = screen.getByRole("dialog", { name: "Share" });
    expect(sheet).toHaveAttribute("data-rebar-component", "bottom-sheet");
    expect(sheet).toHaveAttribute("data-rebar-side", "bottom");
    expect(sheet).toHaveClass("rebar-drawer-content-bottom");
  });

  it("renders a decorative drag handle", () => {
    render(
      <BottomSheet open title="Share">
        Sharing options
      </BottomSheet>,
    );
    const handle = document.querySelector('[data-rebar-part="handle"]');
    expect(handle).not.toBeNull();
    expect(handle).toHaveAttribute("aria-hidden", "true");
    // Decorative only — never itself a dismiss control.
    expect(handle?.tagName).not.toBe("BUTTON");
  });

  it("dismisses via the close button, not just the (non-functional) handle", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="Share">
        Sharing options
      </BottomSheet>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens via its trigger and closes on Escape (controlled)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <BottomSheet
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          trigger={<Button>Open</Button>}
          title="Share"
        >
          Sharing options
        </BottomSheet>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Share" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("works uncontrolled via defaultOpen", () => {
    render(
      <BottomSheet defaultOpen title="Share">
        Sharing options
      </BottomSheet>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
