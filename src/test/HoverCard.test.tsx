import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoverCard } from "../components/HoverCard";

describe("HoverCard", () => {
  it("opens on hover and shows its content", async () => {
    const user = userEvent.setup();
    render(
      <HoverCard trigger={<a href="#profile">@tom</a>} openDelay={0} closeDelay={0}>
        <p>Full profile preview</p>
      </HoverCard>,
    );

    expect(screen.queryByText("Full profile preview")).not.toBeInTheDocument();

    await user.hover(screen.getByRole("link", { name: "@tom" }));
    expect(await screen.findByText("Full profile preview")).toBeInTheDocument();
  });

  it("auto-dismisses once the pointer leaves both the trigger and the content", async () => {
    const user = userEvent.setup();
    render(
      <HoverCard trigger={<a href="#profile">@tom</a>} openDelay={0} closeDelay={0}>
        <p>Full profile preview</p>
      </HoverCard>,
    );

    await user.hover(screen.getByRole("link", { name: "@tom" }));
    await screen.findByText("Full profile preview");

    await user.unhover(screen.getByRole("link", { name: "@tom" }));
    await waitFor(() => {
      expect(screen.queryByText("Full profile preview")).not.toBeInTheDocument();
    });
  });
});
