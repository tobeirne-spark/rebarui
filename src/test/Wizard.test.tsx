import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Wizard } from "../components/Wizard";

afterEach(cleanup);

const STEPS = [
  {
    label: "Team",
    fields: [{ kind: "text" as const, label: "Team name", required: true }],
  },
  {
    label: "Details",
    fields: [{ kind: "text" as const, label: "Notes" }],
  },
];

describe("Wizard", () => {
  it("shows the first step's fields and a disabled Next until its required field is filled", async () => {
    const user = userEvent.setup();
    render(<Wizard steps={STEPS} />);
    expect(screen.getByText("Team")).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();
    await user.type(screen.getByLabelText("Team name *"), "Rebar");
    expect(next).toBeEnabled();
  });

  it("does not show a Back button on the first step, but does on later ones", async () => {
    const user = userEvent.setup();
    render(<Wizard steps={STEPS} />);
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Team name *"), "Rebar");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("calls onSubmit with collected values on the last step's Submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Wizard steps={STEPS} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Team name *"), "Rebar");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("Notes"), "Some notes");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ "0-0": "Rebar", "1-0": "Some notes" });
  });

  it("a required checkbox field must be checked to advance", async () => {
    const user = userEvent.setup();
    render(
      <Wizard
        steps={[{ label: "Agree", fields: [{ kind: "checkbox", label: "I agree", required: true }] }]}
      />,
    );
    const next = screen.getByRole("button", { name: "Submit" });
    expect(next).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /I agree/ }));
    expect(next).toBeEnabled();
  });

  describe("step overflow", () => {
    const LONG_STEPS = Array.from({ length: 5 }, (_, i) => ({ label: `Step ${i + 1}`, fields: [] }));

    it("windows a long wizard to the current step, the next one, and a trailing 'N todo' bucket when nothing is done yet", () => {
      const { container } = render(<Wizard steps={LONG_STEPS} />);
      const titles = Array.from(container.querySelectorAll(".rebar-steps-title")).map((el) => el.textContent);
      expect(titles).toEqual(["Step 1", "Step 2", "3 todo"]);
      expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
    });

    it("shows a leading 'N Done' bucket once at least one step is complete, alongside the current/next steps and a trailing 'N todo' bucket", async () => {
      const user = userEvent.setup();
      const { container } = render(<Wizard steps={LONG_STEPS} />);
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      const titles = Array.from(container.querySelectorAll(".rebar-steps-title")).map((el) => el.textContent);
      expect(titles).toEqual(["2 Done", "Step 3", "Step 4", "1 todo"]);
    });

    it("shows each windowed step's real, absolute step number rather than its position in the shortened list", async () => {
      const user = userEvent.setup();
      const { container } = render(<Wizard steps={LONG_STEPS} />);
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      const icons = Array.from(container.querySelectorAll(".rebar-steps-icon")).map((el) => el.textContent);
      expect(icons).toEqual(["✓", "3", "4", "⋯"]);
    });

    it("drops the trailing 'N todo' bucket once the window reaches the last step", async () => {
      const user = userEvent.setup();
      const { container } = render(<Wizard steps={LONG_STEPS} />);
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      const titles = Array.from(container.querySelectorAll(".rebar-steps-title")).map((el) => el.textContent);
      expect(titles).toEqual(["3 Done", "Step 4", "Step 5"]);
    });

    it("does not window a wizard with 3 or fewer steps", () => {
      const { container } = render(<Wizard steps={STEPS} />);
      const titles = Array.from(container.querySelectorAll(".rebar-steps-title")).map((el) => el.textContent);
      expect(titles).toEqual(["Team", "Details"]);
    });
  });
});
