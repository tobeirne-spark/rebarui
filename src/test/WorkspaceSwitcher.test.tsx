import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceSwitcher } from "../components/WorkspaceSwitcher";

const WORKSPACES = [
  { id: "acme", name: "Acme Corp" },
  { id: "globex", name: "Globex Inc" },
];

describe("WorkspaceSwitcher", () => {
  it("carries data-rebar-component on the trigger", () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} activeId="acme" onSelect={vi.fn()} />);
    expect(document.querySelector('[data-rebar-component="workspace-switcher"]')).not.toBeNull();
  });

  it("shows the active workspace's name on the trigger", () => {
    render(<WorkspaceSwitcher workspaces={WORKSPACES} activeId="globex" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Globex Inc/ })).toBeInTheDocument();
  });

  it("lists every workspace as a real menuitem when opened", async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher workspaces={WORKSPACES} activeId="acme" onSelect={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Acme Corp/ }));
    expect(await screen.findByRole("menuitem", { name: /Acme Corp/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Globex Inc/ })).toBeInTheDocument();
  });

  it("calls onSelect with the picked workspace's id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<WorkspaceSwitcher workspaces={WORKSPACES} activeId="acme" onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /Acme Corp/ }));
    await user.click(await screen.findByRole("menuitem", { name: /Globex Inc/ }));
    expect(onSelect).toHaveBeenCalledWith("globex");
  });

  it("renders an optional trailing create-new action", async () => {
    const user = userEvent.setup();
    const onCreateNew = vi.fn();
    render(
      <WorkspaceSwitcher
        workspaces={WORKSPACES}
        activeId="acme"
        onSelect={vi.fn()}
        onCreateNew={onCreateNew}
        createLabel="Add workspace"
      />,
    );
    await user.click(screen.getByRole("button", { name: /Acme Corp/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Add workspace" }));
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it("omits the create-new action when onCreateNew is unset", async () => {
    const user = userEvent.setup();
    render(<WorkspaceSwitcher workspaces={WORKSPACES} activeId="acme" onSelect={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Acme Corp/ }));
    await screen.findByRole("menuitem", { name: /Globex Inc/ });
    expect(screen.queryByRole("menuitem", { name: /New workspace/ })).not.toBeInTheDocument();
  });
});
