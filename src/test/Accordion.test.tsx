import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion, AccordionItem } from "../components/Accordion";

function Sample() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="a" trigger="Section A">
        Content A
      </AccordionItem>
      <AccordionItem value="b" trigger="Section B">
        Content B
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("hides content until its section is expanded", async () => {
    const user = userEvent.setup();
    render(<Sample />);

    expect(screen.queryByText("Content A")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Section A" }));
    expect(screen.getByText("Content A")).toBeVisible();
  });

  it("marks the trigger's expanded state via aria-expanded", async () => {
    const user = userEvent.setup();
    render(<Sample />);
    const trigger = screen.getByRole("button", { name: "Section A" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
