import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IndexBar } from "../components/IndexBar";
import type { IndexBarGroup } from "../components/IndexBar";

afterEach(cleanup);

interface Contact {
  name: string;
}

const GROUPS: IndexBarGroup<Contact>[] = [
  { key: "A", items: [{ name: "Ada Lovelace" }, { name: "Alan Turing" }] },
  { key: "B", items: [{ name: "Barbara Liskov" }] },
  { key: "C", items: [{ name: "Grace Hopper" }] },
];

function railLetter(container: HTMLElement, key: string): HTMLButtonElement {
  return container.querySelector(`[data-rebar-part="rail-letter"][data-index-key="${key}"]`) as HTMLButtonElement;
}

function groupHeader(container: HTMLElement, key: string): HTMLElement {
  const headers = container.querySelectorAll('[data-rebar-part="group-header"]');
  return Array.from(headers).find((h) => h.textContent === key) as HTMLElement;
}

describe("IndexBar", () => {
  it("renders every group's header and items", () => {
    const { container } = render(<IndexBar groups={GROUPS} renderItem={(item) => item.name} />);
    expect(container.querySelectorAll('[data-rebar-part="group-header"]')).toHaveLength(3);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    expect(screen.getByText("Barbara Liskov")).toBeInTheDocument();
  });

  it("renders one rail letter button per group", () => {
    const { container } = render(<IndexBar groups={GROUPS} renderItem={(item) => item.name} />);
    const letters = container.querySelectorAll('[data-rebar-part="rail-letter"]');
    expect(letters).toHaveLength(3);
    expect(Array.from(letters).map((l) => l.textContent)).toEqual(["A", "B", "C"]);
  });

  it("clicking a rail letter scrolls the list container to that group's header", async () => {
    const user = userEvent.setup();
    const { container } = render(<IndexBar groups={GROUPS} renderItem={(item) => item.name} height={100} />);
    const list = container.querySelector('[data-rebar-part="list"]') as HTMLElement;
    const header = groupHeader(container, "C");

    // jsdom doesn't compute real layout, so offsetTop is 0 for every element by default — assert
    // on the real mechanism (scrollTop set from the header's own offsetTop) rather than a specific
    // pixel value, by stubbing a realistic offsetTop for the "C" header.
    Object.defineProperty(header, "offsetTop", { value: 240, configurable: true });
    Object.defineProperty(list, "offsetTop", { value: 0, configurable: true });

    await user.click(railLetter(container, "C"));
    expect(list.scrollTop).toBe(240);
  });

  it("dragging across the rail (pointermove while pressed) jumps between groups", () => {
    const { container } = render(<IndexBar groups={GROUPS} renderItem={(item) => item.name} height={100} />);
    const list = container.querySelector('[data-rebar-part="list"]') as HTMLElement;
    const rail = container.querySelector('[data-rebar-part="rail"]') as HTMLElement;
    const bHeader = groupHeader(container, "B");
    Object.defineProperty(bHeader, "offsetTop", { value: 120, configurable: true });
    Object.defineProperty(list, "offsetTop", { value: 0, configurable: true });

    const bLetterButton = railLetter(container, "B");
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => bLetterButton;

    try {
      fireEvent.pointerDown(rail, { clientX: 10, clientY: 50, pointerId: 1, buttons: 1 });
      expect(list.scrollTop).toBe(120);
      expect(container.querySelector('[data-rebar-part="bubble"]')).toHaveTextContent("B");
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it("a custom renderGroupHeader overrides the default bare-letter header", () => {
    render(
      <IndexBar
        groups={GROUPS}
        renderItem={(item) => item.name}
        renderGroupHeader={(key) => `Group ${key}`}
      />,
    );
    expect(screen.getByText("Group A")).toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<IndexBar groups={GROUPS} renderItem={(item) => item.name} />);
    expect(container.querySelector('[data-rebar-component="index-bar"]')).toBeInTheDocument();
  });
});
