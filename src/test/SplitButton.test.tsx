import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SplitButton } from "../components/SplitButton";

describe("SplitButton", () => {
  it("renders the label as the primary action", () => {
    render(<SplitButton label="Save" items={[]} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "data-rebar-component",
      "button",
    );
  });

  it("carries data-rebar-component on its own root", () => {
    render(<SplitButton label="Save" items={[]} data-testid="split" />);
    expect(screen.getByTestId("split")).toHaveAttribute("data-rebar-component", "split-button");
  });

  it("fires onClick when the primary button is clicked, without opening the menu", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SplitButton label="Save" onClick={onClick} items={[{ label: "Save as draft" }]} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Save as draft" })).not.toBeInTheDocument();
  });

  it("opens the popover on caret click and fires only the clicked item's onSelect", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSelectDraft = vi.fn();
    const onSelectDelete = vi.fn();
    render(
      <SplitButton
        label="Save"
        onClick={onClick}
        items={[
          { label: "Save as draft", onSelect: onSelectDraft },
          { label: "Delete", onSelect: onSelectDelete },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "More Save actions" }));
    const draftItem = await screen.findByRole("button", { name: "Save as draft" });
    await user.click(draftItem);

    expect(onSelectDraft).toHaveBeenCalledTimes(1);
    expect(onSelectDelete).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports a destructive variant, applied to both the primary and caret buttons", () => {
    render(<SplitButton label="Delete" variant="destructive" items={[{ label: "Delete forever" }]} />);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-rebar-variant", "destructive");
    expect(screen.getByRole("button", { name: "More Delete actions" })).toHaveAttribute(
      "data-rebar-variant",
      "destructive",
    );
  });
});
