import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible } from "../components/Collapsible";

describe("Collapsible", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Collapsible trigger="Show more">Hidden detail</Collapsible>);
    expect(document.querySelector('[data-rebar-component="collapsible"]')).not.toBeNull();
  });

  it("starts collapsed by default and toggles open on trigger click (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<Collapsible trigger="Show more">Hidden detail</Collapsible>);

    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByText("Hidden detail")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();
  });

  it("honors defaultOpen", () => {
    render(
      <Collapsible trigger="Show more" defaultOpen>
        Hidden detail
      </Collapsible>,
    );
    expect(screen.getByText("Hidden detail")).toBeVisible();
  });

  it("in controlled mode, only changes state via onOpenChange being applied by the caller", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    // open is fixed at false; caller never applies onOpenChange's result back.
    render(
      <Collapsible trigger="Show more" open={false} onOpenChange={onOpenChange}>
        Hidden detail
      </Collapsible>,
    );

    await user.click(screen.getByRole("button", { name: "Show more" }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Content stays out of the DOM — the click alone must not have changed anything.
    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();
  });

  it("in controlled mode, applying onOpenChange's value back does update the panel", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Collapsible trigger="Show more" open={open} onOpenChange={setOpen}>
          Hidden detail
        </Collapsible>
      );
    }

    render(<Controlled />);
    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByText("Hidden detail")).toBeVisible();
  });

  it("reflects state via aria-expanded", async () => {
    const user = userEvent.setup();
    render(<Collapsible trigger="Show more">Hidden detail</Collapsible>);

    const trigger = screen.getByRole("button", { name: "Show more" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("removes the content region from the accessibility tree entirely when collapsed", async () => {
    const user = userEvent.setup();
    render(<Collapsible trigger="Show more">Hidden detail</Collapsible>);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more" }));
    const region = screen.getByRole("region");
    expect(region).toHaveTextContent("Hidden detail");

    const trigger = screen.getByRole("button", { name: "Show more" });
    expect(trigger).toHaveAttribute("aria-controls", region.id);
    expect(region).toHaveAttribute("aria-labelledby", trigger.id);
  });

  it("sets data-rebar-open only while expanded", async () => {
    const user = userEvent.setup();
    render(<Collapsible trigger="Show more">Hidden detail</Collapsible>);

    const trigger = screen.getByRole("button", { name: "Show more" });
    expect(trigger).not.toHaveAttribute("data-rebar-open");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("data-rebar-open");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Collapsible trigger="Show more" disabled>
        Hidden detail
      </Collapsible>,
    );

    const trigger = screen.getByRole("button", { name: "Show more" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByText("Hidden detail")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("forwards arbitrary data-*/aria-* props onto the root", () => {
    render(
      <Collapsible trigger="Show more" data-testid="filters-panel" aria-label="Filters">
        Hidden detail
      </Collapsible>,
    );
    const root = screen.getByTestId("filters-panel");
    expect(root).toHaveAttribute("aria-label", "Filters");
    expect(root).toHaveAttribute("data-rebar-component", "collapsible");
  });
});
