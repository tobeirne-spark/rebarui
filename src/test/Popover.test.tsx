import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "../components/Popover";
import { Button } from "../components/Button";

describe("Popover", () => {
  it("opens on trigger click and shows its content", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<Button>Filters</Button>}>
        <p>Filter options</p>
      </Popover>,
    );

    expect(screen.queryByText("Filter options")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filters" }));
    expect(await screen.findByText("Filter options")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<Button>Filters</Button>}>
        <p>Filter options</p>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Filters" }));
    await screen.findByText("Filter options");

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Filter options")).not.toBeInTheDocument();
  });
});
