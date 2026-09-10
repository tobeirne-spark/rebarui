import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalTracker } from "../components/GoalTracker";
import type { GoalTrackerFocusArea } from "../components/GoalTracker";

afterEach(cleanup);

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })),
  });
}

function baseFocusAreas(): GoalTrackerFocusArea[] {
  return [
    {
      id: "fa1",
      text: "Grow membership",
      goals: [
        { id: "g1", text: "Reach 500 members", completed: false },
        { id: "g2", text: "Host 3 events", completed: true },
      ],
    },
    {
      id: "fa2",
      text: "Improve engagement",
      goals: [],
    },
  ];
}

function getBurst(container: HTMLElement) {
  return container.querySelector("[data-rebar-part='goal-burst']");
}

describe("GoalTracker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error -- test-only override
    delete window.matchMedia;
  });

  it("renders the 3-level hierarchy: aspiration, focus areas, and their goals", () => {
    render(<GoalTracker aspiration="Become the top board network" focusAreas={baseFocusAreas()} />);

    expect(screen.getByText("Become the top board network")).toBeInTheDocument();
    expect(screen.getByText("Grow membership")).toBeInTheDocument();
    expect(screen.getByText("Improve engagement")).toBeInTheDocument();
    expect(screen.getByText("Reach 500 members")).toBeInTheDocument();
    expect(screen.getByText("Host 3 events")).toBeInTheDocument();
  });

  it("shows a visible completion count per focus area", () => {
    render(<GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} />);
    expect(screen.getByText("1 of 2 complete")).toBeInTheDocument();
    expect(screen.getByText("0 of 0 complete")).toBeInTheDocument();
  });

  it("shows 'No goals yet' for a focus area with no goals instead of a blank list", () => {
    render(<GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} />);
    expect(screen.getByText("No goals yet")).toBeInTheDocument();
  });

  it("renders the shared Empty component when focusAreas is empty, not a bare header", () => {
    const { container } = render(<GoalTracker aspiration="Aspiration" focusAreas={[]} />);
    expect(screen.getByText("No focus areas yet")).toBeInTheDocument();
    expect(container.querySelector("[data-rebar-component='empty']")).toBeInTheDocument();
    // The aspiration itself still renders above the empty state — as both its own visible
    // caption ("Aspiration" the label) and its edited value ("Aspiration", coincidentally the
    // same text in this test's fixture).
    expect(screen.getAllByText("Aspiration")).toHaveLength(2);
  });

  it("shows a visible caption above the aspiration and each focus area, not just an aria-label", () => {
    render(<GoalTracker aspiration="Become the top board network" focusAreas={baseFocusAreas()} />);
    const container = screen.getByText("Become the top board network").closest(
      "[data-rebar-component='goal-tracker']",
    ) as HTMLElement;
    expect(within(container).getByText("Aspiration")).toBeInTheDocument();
    expect(within(container).getAllByText("Focus area")).toHaveLength(2);
    // Only fa1 has goals, so only it gets a "Goals" caption.
    expect(within(container).getAllByText("Goals")).toHaveLength(1);
  });

  it("omits the Add focus area / Add goal affordances unless their callbacks are passed", () => {
    render(<GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} />);
    expect(screen.queryByText("+ Add focus area")).not.toBeInTheDocument();
    expect(screen.queryAllByText("+ Add goal")).toHaveLength(0);
  });

  it("shows Add focus area / Add goal affordances when their callbacks are passed, and calls them", async () => {
    const user = userEvent.setup();
    const onAddFocusArea = vi.fn();
    const onAddGoal = vi.fn();
    render(
      <GoalTracker
        aspiration="Aspiration"
        focusAreas={baseFocusAreas()}
        onAddFocusArea={onAddFocusArea}
        onAddGoal={onAddGoal}
      />,
    );

    await user.click(screen.getByText("+ Add focus area"));
    expect(onAddFocusArea).toHaveBeenCalled();

    const firstAddGoal = screen.getAllByText("+ Add goal")[0]!;
    await user.click(firstAddGoal);
    expect(onAddGoal).toHaveBeenCalledWith("fa1");
  });

  it("supports a bigger celebration burst via the celebration prop", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} celebration="big" />,
    );

    const goalItem = screen.getByText("Reach 500 members").closest("[data-rebar-part='goal']") as HTMLElement;
    const toggle = within(goalItem).getByRole("checkbox");
    await user.click(toggle);

    const particles = container.querySelectorAll(".rebar-goal-tracker-burst-particle");
    // "big" uses 12 arms vs "small"'s 8.
    expect(particles.length).toBe(12);
  });

  it("never renders a burst when celebration is 'none', even on completing a goal", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} celebration="none" />,
    );

    const goalItem = screen.getByText("Reach 500 members").closest("[data-rebar-part='goal']") as HTMLElement;
    const toggle = within(goalItem).getByRole("checkbox");
    await user.click(toggle);

    expect(getBurst(container)).not.toBeInTheDocument();
  });

  it("editing the aspiration fires onAspirationChange with the new text", async () => {
    const user = userEvent.setup();
    const onAspirationChange = vi.fn();

    function Wrapper() {
      const [aspiration, setAspiration] = useState("Old aspiration");
      return (
        <GoalTracker
          aspiration={aspiration}
          focusAreas={[]}
          onAspirationChange={(text) => {
            onAspirationChange(text);
            setAspiration(text);
          }}
        />
      );
    }

    render(<Wrapper />);
    await user.click(screen.getByRole("button", { name: "Aspiration, click to edit" }));
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "New aspiration{Enter}");

    expect(onAspirationChange).toHaveBeenLastCalledWith("New aspiration");
  });

  it("editing a focus area fires onFocusAreaChange with its id", async () => {
    const user = userEvent.setup();
    const onFocusAreaChange = vi.fn();

    function Wrapper() {
      const [focusAreas, setFocusAreas] = useState(baseFocusAreas());
      return (
        <GoalTracker
          aspiration="Aspiration"
          focusAreas={focusAreas}
          onFocusAreaChange={(id, text) => {
            onFocusAreaChange(id, text);
            setFocusAreas((prev) => prev.map((fa) => (fa.id === id ? { ...fa, text } : fa)));
          }}
        />
      );
    }

    render(<Wrapper />);
    const firstFocusArea = screen.getAllByRole("button", { name: "Focus area, click to edit" })[0]!;
    await user.click(firstFocusArea);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Renamed focus area{Enter}");

    expect(onFocusAreaChange).toHaveBeenLastCalledWith("fa1", "Renamed focus area");
  });

  it("editing a goal fires onGoalChange with its focusAreaId and goalId", async () => {
    const user = userEvent.setup();
    const onGoalChange = vi.fn();

    function Wrapper() {
      const [focusAreas, setFocusAreas] = useState(baseFocusAreas());
      return (
        <GoalTracker
          aspiration="Aspiration"
          focusAreas={focusAreas}
          onGoalChange={(focusAreaId, goalId, text) => {
            onGoalChange(focusAreaId, goalId, text);
            setFocusAreas((prev) =>
              prev.map((fa) =>
                fa.id !== focusAreaId
                  ? fa
                  : { ...fa, goals: fa.goals.map((g) => (g.id === goalId ? { ...g, text } : g)) },
              ),
            );
          }}
        />
      );
    }

    render(<Wrapper />);
    // fa1's goals are "Reach 500 members" (g1) then "Host 3 events" (g2).
    const firstGoal = screen.getAllByRole("button", { name: "Goal, click to edit" })[0]!;
    await user.click(firstGoal);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "Reach 1000 members{Enter}");

    expect(onGoalChange).toHaveBeenLastCalledWith("fa1", "g1", "Reach 1000 members");
  });

  it("toggling a goal to complete fires onGoalToggle(true) and triggers the burst", async () => {
    const user = userEvent.setup();
    const onGoalToggle = vi.fn();
    const { container } = render(
      <GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} onGoalToggle={onGoalToggle} />,
    );

    // g1 ("Reach 500 members") starts incomplete.
    const goalItem = screen.getByText("Reach 500 members").closest("[data-rebar-part='goal']") as HTMLElement;
    const toggle = within(goalItem).getByRole("checkbox");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(onGoalToggle).toHaveBeenCalledWith("fa1", "g1", true);
    expect(getBurst(container)).toBeInTheDocument();
  });

  it("un-completing a goal fires onGoalToggle(false) and does NOT trigger the burst", async () => {
    const user = userEvent.setup();
    const onGoalToggle = vi.fn();
    const { container } = render(
      <GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} onGoalToggle={onGoalToggle} />,
    );

    // g2 ("Host 3 events") starts completed.
    const goalItem = screen.getByText("Host 3 events").closest("[data-rebar-part='goal']") as HTMLElement;
    const toggle = within(goalItem).getByRole("checkbox");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);

    expect(onGoalToggle).toHaveBeenCalledWith("fa1", "g2", false);
    expect(getBurst(container)).not.toBeInTheDocument();
  });

  it("skips the burst entirely when prefers-reduced-motion is set, even on completing a goal", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    const onGoalToggle = vi.fn();
    const { container } = render(
      <GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} onGoalToggle={onGoalToggle} />,
    );

    const goalItem = screen.getByText("Reach 500 members").closest("[data-rebar-part='goal']") as HTMLElement;
    const toggle = within(goalItem).getByRole("checkbox");
    await user.click(toggle);

    expect(onGoalToggle).toHaveBeenCalledWith("fa1", "g1", true);
    expect(getBurst(container)).not.toBeInTheDocument();
  });

  it("deleting a goal requires Popconfirm confirmation before onDelete fires", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} onDelete={onDelete} />);

    const goalItem = screen.getByText("Reach 500 members").closest("[data-rebar-part='goal']") as HTMLElement;
    const deleteTrigger = within(goalItem).getByRole("button", { name: /delete goal/i });

    await user.click(deleteTrigger);
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText(/Delete "Reach 500 members"\?/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onDelete).toHaveBeenCalledWith("goal", { focusAreaId: "fa1", goalId: "g1" });
  });

  it("deleting a focus area requires Popconfirm confirmation before onDelete fires", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} onDelete={onDelete} />);

    const focusAreaItem = screen
      .getByText("Grow membership")
      .closest("[data-rebar-part='focus-area']") as HTMLElement;
    const deleteTrigger = within(focusAreaItem).getByRole("button", { name: /delete focus area/i });

    await user.click(deleteTrigger);
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onDelete).toHaveBeenCalledWith("focusArea", { focusAreaId: "fa1", goalId: undefined });
  });

  it("carries the expected data-rebar-component/data-rebar-part hooks", () => {
    const { container } = render(
      <GoalTracker aspiration="Aspiration" focusAreas={baseFocusAreas()} />,
    );
    expect(container.querySelector("[data-rebar-component='goal-tracker']")).toBeInTheDocument();
    expect(container.querySelector("[data-rebar-part='aspiration']")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-rebar-part='focus-area']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-rebar-part='goal']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-rebar-part='goal-toggle']")).toHaveLength(2);
  });

  it("forwards arbitrary data-*/aria-* props to the root element", () => {
    render(
      <GoalTracker
        aspiration="Aspiration"
        focusAreas={[]}
        data-testid="okr-tracker"
        aria-label="Team OKRs"
      />,
    );
    expect(screen.getByTestId("okr-tracker")).toHaveAttribute("aria-label", "Team OKRs");
  });
});
