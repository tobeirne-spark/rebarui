import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "../components/Tooltip";
import { Button } from "../components/Button";

describe("Tooltip", () => {
  it("shows its content when the trigger receives focus", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Saves your changes">
        <Button>Save</Button>
      </Tooltip>,
    );

    expect(screen.queryByText("Saves your changes")).not.toBeInTheDocument();

    await user.tab();
    expect(await screen.findByText("Saves your changes")).toBeInTheDocument();
  });

  it("carries data-rebar-component on the tooltip content", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Saves your changes">
        <Button>Save</Button>
      </Tooltip>,
    );
    await user.tab();
    const content = await screen.findByText("Saves your changes");
    expect(content.closest('[data-rebar-component="tooltip"]')).not.toBeNull();
  });
});
