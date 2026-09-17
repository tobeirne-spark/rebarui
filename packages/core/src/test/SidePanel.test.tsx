import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidePanel } from "../components/SidePanel";

afterEach(cleanup);

describe("SidePanel", () => {
  it("renders open by default, with a title and content, no backdrop element", () => {
    const { container } = render(
      <SidePanel title="Thread">
        <p>Reply content</p>
      </SidePanel>,
    );
    expect(screen.getByRole("heading", { name: "Thread" })).toBeInTheDocument();
    expect(screen.getByText("Reply content")).toBeInTheDocument();
    // Non-modal: no Radix overlay/portal — the panel is a plain <aside> in normal flow.
    expect(container.querySelector('[data-rebar-part="overlay"]')).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Thread" }).closest("aside")).toHaveAttribute(
      "data-rebar-open",
      "true",
    );
  });

  it("collapses to a rail on the close button, and reopens from the rail's toggle", async () => {
    const user = userEvent.setup();
    render(
      <SidePanel title="Thread">
        <p>Reply content</p>
      </SidePanel>,
    );
    await user.click(screen.getByRole("button", { name: "Collapse Thread" }));
    expect(screen.queryByText("Reply content")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Open Thread" });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByText("Reply content")).toBeInTheDocument();
  });

  it("defaultOpen=false starts collapsed", () => {
    render(
      <SidePanel title="Thread" defaultOpen={false}>
        <p>Reply content</p>
      </SidePanel>,
    );
    expect(screen.queryByText("Reply content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Thread" })).toBeInTheDocument();
  });

  it("controlled `open` is driven entirely by the caller, calling onOpenChange instead of toggling itself", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <SidePanel title="Thread" open onOpenChange={onOpenChange}>
        <p>Reply content</p>
      </SidePanel>,
    );
    await user.click(screen.getByRole("button", { name: "Collapse Thread" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open — the caller hasn't passed open=false back in yet.
    expect(screen.getByText("Reply content")).toBeInTheDocument();

    rerender(
      <SidePanel title="Thread" open={false} onOpenChange={onOpenChange}>
        <p>Reply content</p>
      </SidePanel>,
    );
    expect(screen.queryByText("Reply content")).not.toBeInTheDocument();
  });

  it("hideToggle omits both the close and reopen buttons", () => {
    const { rerender } = render(
      <SidePanel title="Thread" hideToggle>
        <p>Reply content</p>
      </SidePanel>,
    );
    expect(screen.queryByRole("button", { name: "Collapse Thread" })).not.toBeInTheDocument();

    rerender(
      <SidePanel title="Thread" hideToggle defaultOpen={false}>
        <p>Reply content</p>
      </SidePanel>,
    );
    expect(screen.queryByRole("button", { name: "Open Thread" })).not.toBeInTheDocument();
  });
});
