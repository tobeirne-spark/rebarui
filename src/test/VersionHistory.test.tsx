import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VersionHistory } from "../components/VersionHistory";
import type { VersionSnapshot } from "../components/VersionHistory";
import { Button } from "../components/Button";

afterEach(cleanup);

const versions: VersionSnapshot[] = [
  { id: "v3", label: "Auto-saved", timestamp: "2020-01-03T00:00:00.000Z", preview: "Third preview" },
  { id: "v2", label: "Before AI edit", timestamp: "2020-01-02T00:00:00.000Z", preview: "Second preview" },
  { id: "v1", label: "Initial draft", timestamp: "2020-01-01T00:00:00.000Z", preview: "First preview" },
];

describe("VersionHistory", () => {
  it("renders versions in the given order", () => {
    render(<VersionHistory open versions={versions} onRestore={vi.fn()} />);
    const list = screen.getByRole("list");
    expect(list.textContent).toMatch(/Auto-saved.*Before AI edit.*Initial draft/s);
  });

  it("carries the version-history data-rebar-component on its root", () => {
    render(<VersionHistory open versions={versions} onRestore={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-rebar-component", "version-history");
  });

  it("marks the current version with a Current pill", () => {
    render(
      <VersionHistory open versions={versions} currentVersionId="v2" onRestore={vi.fn()} />,
    );
    const rows = screen.getAllByRole("listitem");
    const currentRow = rows.find((row) => row.textContent?.includes("Before AI edit"));
    expect(currentRow).toHaveAttribute("data-rebar-current", "true");
    expect(within(currentRow!).getByText("Current")).toBeInTheDocument();
  });

  it("requires confirmation before onRestore fires — clicking Restore alone does not call it", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<VersionHistory open versions={versions} onRestore={onRestore} />);

    const rows = screen.getAllByRole("listitem");
    const row = rows.find((r) => r.textContent?.includes("Before AI edit"))!;
    await user.click(within(row).getByRole("button", { name: /Restore version/ }));

    expect(onRestore).not.toHaveBeenCalled();
    // The confirm question is now visible.
    expect(screen.getByText(/Restore "Before AI edit"/)).toBeInTheDocument();
  });

  it("confirming the restore calls onRestore with the right version", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<VersionHistory open versions={versions} onRestore={onRestore} />);

    const rows = screen.getAllByRole("listitem");
    const row = rows.find((r) => r.textContent?.includes("Before AI edit"))!;
    await user.click(within(row).getByRole("button", { name: /Restore version/ }));

    // Popconfirm's own confirm/cancel buttons render into a Radix portal (outside the row's own
    // DOM subtree), and only one row's Popconfirm is open at a time — so an exact-name query
    // against the whole document unambiguously finds the confirm action, distinct from every
    // row's own trigger (named "Restore version \"<label>\"").
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(versions[1]);
  });

  it("canceling the confirm does not call onRestore", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<VersionHistory open versions={versions} onRestore={onRestore} />);

    const rows = screen.getAllByRole("listitem");
    const row = rows.find((r) => r.textContent?.includes("Initial draft"))!;
    await user.click(within(row).getByRole("button", { name: /Restore version/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRestore).not.toHaveBeenCalled();
    expect(screen.queryByText(/Restore "Initial draft"/)).not.toBeInTheDocument();
  });

  it("supports a custom restoreConfirmMessage", async () => {
    const user = userEvent.setup();
    render(
      <VersionHistory
        open
        versions={versions}
        onRestore={vi.fn()}
        restoreConfirmMessage={(v) => `Really go back to ${v.label}?`}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    const row = rows.find((r) => r.textContent?.includes("Initial draft"))!;
    await user.click(within(row).getByRole("button", { name: /Restore version/ }));
    expect(screen.getByText("Really go back to Initial draft?")).toBeInTheDocument();
  });

  it("renders the shared Empty component for an empty versions array", () => {
    render(<VersionHistory open versions={[]} onRestore={vi.fn()} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("No versions yet")).toBeInTheDocument();
  });

  it("works uncontrolled via defaultOpen and trigger", async () => {
    const user = userEvent.setup();
    render(
      <VersionHistory
        defaultOpen={false}
        trigger={<Button>Open history</Button>}
        versions={versions}
        onRestore={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open history" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("supports controlled open state", async () => {
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <VersionHistory
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
          versions={versions}
          onRestore={vi.fn()}
        />
      );
    }

    const user = userEvent.setup();
    render(<Controlled />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
