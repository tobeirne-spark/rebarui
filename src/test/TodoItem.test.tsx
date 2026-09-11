import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "../components/TodoItem";

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

function getBurst(container: HTMLElement) {
  return container.querySelector("[data-rebar-part='burst']");
}

describe("TodoItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error -- test-only override
    delete window.matchMedia;
  });

  it("renders the label and a checkbox reflecting the completed state", () => {
    render(<TodoItem label="Ship the release" completed={false} onToggle={() => {}} toggleLabel="Mark complete" />);
    expect(screen.getByText("Ship the release")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Mark complete" })).toHaveAttribute("aria-checked", "false");
  });

  it("accepts a rich ReactNode label, not just plain text", () => {
    render(
      <TodoItem
        label={<strong>Rich label</strong>}
        completed={false}
        onToggle={() => {}}
        toggleLabel="Mark complete"
      />,
    );
    expect(screen.getByText("Rich label").tagName).toBe("STRONG");
  });

  it("clicking the toggle fires onToggle with the flipped state and triggers the burst on completion", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { container } = render(
      <TodoItem label="Task" completed={false} onToggle={onToggle} toggleLabel="Mark complete" />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(getBurst(container)).toBeInTheDocument();
  });

  it("does not trigger the burst when un-completing", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { container } = render(
      <TodoItem label="Task" completed onToggle={onToggle} toggleLabel="Mark incomplete" />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(getBurst(container)).not.toBeInTheDocument();
  });

  it("supports a bigger celebration burst via the celebration prop", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TodoItem label="Task" completed={false} onToggle={() => {}} toggleLabel="Mark complete" celebration="big" />,
    );

    await user.click(screen.getByRole("checkbox"));
    const particles = container.querySelectorAll(".rebar-todo-item-burst-particle");
    expect(particles.length).toBe(12);
  });

  it("never renders a burst when celebration is 'none'", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TodoItem label="Task" completed={false} onToggle={() => {}} toggleLabel="Mark complete" celebration="none" />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(getBurst(container)).not.toBeInTheDocument();
  });

  it("skips the burst when prefers-reduced-motion is set", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();
    const { container } = render(
      <TodoItem label="Task" completed={false} onToggle={() => {}} toggleLabel="Mark complete" />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(getBurst(container)).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component/data-rebar-part hooks", () => {
    const { container } = render(
      <TodoItem label="Task" completed={false} onToggle={() => {}} toggleLabel="Mark complete" />,
    );
    expect(container.querySelector("[data-rebar-component='todo-item']")).toBeInTheDocument();
    expect(container.querySelector("[data-rebar-part='toggle']")).toBeInTheDocument();
    expect(container.querySelector("[data-rebar-part='label']")).toBeInTheDocument();
  });

  it("forwards arbitrary data-*/aria-* props to the root element", () => {
    render(
      <TodoItem
        label="Task"
        completed={false}
        onToggle={() => {}}
        toggleLabel="Mark complete"
        data-testid="row"
        aria-label="Task row"
      />,
    );
    expect(screen.getByTestId("row")).toHaveAttribute("aria-label", "Task row");
  });
});
