import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Drawer } from "../components/Drawer";
import { Button } from "../components/Button";

describe("Drawer", () => {
  it("renders with an accessible dialog role and the given title", () => {
    render(
      <Drawer open title="Filters">
        Filter controls
      </Drawer>,
    );
    const drawer = screen.getByRole("dialog", { name: "Filters" });
    expect(drawer).toHaveAttribute("data-rebar-component", "drawer");
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  it("falls back to a visually-hidden accessible name when no title is given", () => {
    render(<Drawer open>Content</Drawer>);
    expect(screen.getByRole("dialog", { name: "Drawer" })).toBeInTheDocument();
  });

  it("opens via its trigger and closes on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Drawer
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          trigger={<Button>Open</Button>}
          title="Filters"
        >
          Filter controls
        </Drawer>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("has a labeled close button that fires onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer open onOpenChange={onOpenChange} title="Filters">
        Filter controls
      </Drawer>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("works uncontrolled via defaultOpen", async () => {
    const user = userEvent.setup();
    render(
      <Drawer defaultOpen title="Filters">
        Filter controls
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("defaults to side=right and size=360, applied as data attribute and inline style", () => {
    render(
      <Drawer open title="Filters">
        Content
      </Drawer>,
    );
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("data-rebar-side", "right");
    expect(drawer).toHaveStyle({ width: "360px" });
  });

  it("applies a custom side and size — width for left/right", () => {
    render(
      <Drawer open title="Filters" side="left" size={280}>
        Content
      </Drawer>,
    );
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("data-rebar-side", "left");
    expect(drawer).toHaveClass("rebar-drawer-content-left");
    expect(drawer).toHaveStyle({ width: "280px" });
  });

  it("applies size as height for top/bottom sides", () => {
    render(
      <Drawer open title="Filters" side="bottom" size={200}>
        Content
      </Drawer>,
    );
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveClass("rebar-drawer-content-bottom");
    expect(drawer).toHaveStyle({ height: "200px" });
  });
});
