import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Steps } from "../components/Steps";

const items = [
  { title: "Team" },
  { title: "Details" },
  { title: "Review" },
];

describe("Steps", () => {
  it("derives finish/process/wait status from the current index", () => {
    const { container } = render(<Steps items={items} current={1} />);
    const stepItems = container.querySelectorAll('[data-rebar-part="item"]');
    expect(stepItems[0]).toHaveAttribute("data-rebar-status", "finish");
    expect(stepItems[1]).toHaveAttribute("data-rebar-status", "process");
    expect(stepItems[2]).toHaveAttribute("data-rebar-status", "wait");
  });

  it("marks the current step with aria-current=step", () => {
    render(<Steps items={items} current={1} />);
    expect(screen.getByText("Details").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Team").closest("li")).not.toHaveAttribute("aria-current");
  });

  it("lets an explicit per-item status override the derived one", () => {
    const { container } = render(
      <Steps items={[{ title: "Team", status: "error" }, { title: "Details" }]} current={0} />,
    );
    expect(container.querySelector('[data-rebar-part="item"]')).toHaveAttribute(
      "data-rebar-status",
      "error",
    );
  });

  it("renders an optional description under the title", () => {
    render(<Steps items={[{ title: "Team", description: "Pick a team" }]} />);
    expect(screen.getByText("Pick a team")).toBeInTheDocument();
  });

  it("lets an explicit icon override the derived index/✓/✕", () => {
    const { container } = render(<Steps items={[{ title: "Bucket", status: "wait", icon: "⋯" }]} />);
    expect(container.querySelector('[data-rebar-part="icon"]')).toHaveTextContent("⋯");
  });
});
