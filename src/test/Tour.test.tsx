import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tour } from "../components/Tour";
import type { TourStep } from "../components/Tour";

afterEach(cleanup);

describe("Tour", () => {
  it("renders the callout for the current step's title", () => {
    const target = document.createElement("button");
    const steps: TourStep[] = [
      { target: () => target, title: "Step one", description: "First thing" },
      { target: () => target, title: "Step two" },
    ];
    render(<Tour open steps={steps} />);
    expect(screen.getByRole("heading", { name: "Step one" })).toBeInTheDocument();
    expect(screen.getByText("First thing")).toBeInTheDocument();
  });

  it("advances currentStep and fires onStepChange when Next is clicked", async () => {
    const user = userEvent.setup();
    const target = document.createElement("button");
    const onStepChange = vi.fn();
    const steps: TourStep[] = [
      { target: () => target, title: "Step one" },
      { target: () => target, title: "Step two" },
    ];

    function Controlled() {
      const [step, setStep] = useState(0);
      return (
        <Tour
          open
          steps={steps}
          currentStep={step}
          onStepChange={(next) => {
            setStep(next);
            onStepChange(next);
          }}
        />
      );
    }
    render(<Controlled />);

    // First step: no Prev button (nothing to go back to).
    expect(screen.queryByRole("button", { name: "Prev" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onStepChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole("heading", { name: "Step two" })).toBeInTheDocument();
  });

  it("fires onFinish when Finish is clicked on the last step", async () => {
    const user = userEvent.setup();
    const target = document.createElement("button");
    const onFinish = vi.fn();
    const onOpenChange = vi.fn();
    const steps: TourStep[] = [{ target: () => target, title: "Only step" }];
    render(<Tour open steps={steps} onFinish={onFinish} onOpenChange={onOpenChange} />);

    // Single step: it's simultaneously first and last, so Next reads "Finish".
    const finishButton = screen.getByRole("button", { name: "Finish" });
    expect(finishButton).toBeInTheDocument();
    await user.click(finishButton);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the callout centered without crashing when target() returns null", () => {
    const steps: TourStep[] = [{ target: () => null, title: "No target here" }];
    render(<Tour open steps={steps} />);
    expect(screen.getByRole("heading", { name: "No target here" })).toBeInTheDocument();
    // No highlight cutout is drawn when there's no real element to highlight.
    expect(document.querySelector('[data-rebar-part="highlight"]')).not.toBeInTheDocument();
  });

  it("renders nothing when not open", () => {
    const steps: TourStep[] = [{ target: () => null, title: "Hidden" }];
    render(<Tour open={false} steps={steps} />);
    expect(screen.queryByRole("heading", { name: "Hidden" })).not.toBeInTheDocument();
  });
});
