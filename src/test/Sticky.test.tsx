import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sticky } from "../components/Sticky";

describe("Sticky", () => {
  it("renders a title, body, and tags with a data-rebar-component marker", () => {
    const { container } = render(
      <Sticky title="Fast reviews" tags={["retro"]}>
        Went well this sprint
      </Sticky>,
    );
    expect(container.querySelector('[data-rebar-component="sticky"]')).toBeInTheDocument();
    expect(screen.getByText("Fast reviews")).toBeInTheDocument();
    expect(screen.getByText("Went well this sprint")).toBeInTheDocument();
    expect(screen.getByText("retro")).toBeInTheDocument();
  });

  it("picks the same color and rotation for the same seed", () => {
    const { container: a } = render(<Sticky title="Note" seed="fixed-id" />);
    const { container: b } = render(<Sticky title="Note" seed="fixed-id" />);
    const styleOf = (c: HTMLElement) => (c.querySelector('[data-rebar-component="sticky"]') as HTMLElement).style;
    expect(styleOf(a as unknown as HTMLElement).background).toBe(styleOf(b as unknown as HTMLElement).background);
    expect(styleOf(a as unknown as HTMLElement).transform).toBe(styleOf(b as unknown as HTMLElement).transform);
  });

  it("uses an explicit color over the deterministic default", () => {
    const { container } = render(<Sticky title="Note" seed="fixed-id" color="#123456" />);
    const el = container.querySelector('[data-rebar-component="sticky"]') as HTMLElement;
    expect(el.style.background).toBe("rgb(18, 52, 86)");
  });

  it("gives the title dark text on a light color, and light text on a dark color", () => {
    const light = render(<Sticky title="Note" color="#fff59d" />);
    expect(screen.getByText("Note")).toHaveStyle({ color: "#212121" });
    light.unmount();

    render(<Sticky title="Note" color="#111111" />);
    expect(screen.getByText("Note")).toHaveStyle({ color: "#f5f5f5" });
  });

  it("forwards arbitrary DOM props, including event handlers", () => {
    const onClick = vi.fn();
    render(<Sticky title="Note" onClick={onClick} data-testid="note" />);
    screen.getByTestId("note").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("adds the active-border class when activeBorder is set", () => {
    const { container } = render(<Sticky title="Note" activeBorder />);
    expect(container.querySelector('[data-rebar-component="sticky"]')).toHaveClass("rebar-active-border");
  });

  it("omits the body and tags rows when unset", () => {
    const { container } = render(<Sticky title="Note" />);
    expect(container.querySelector('[data-rebar-part="body"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="tags"]')).not.toBeInTheDocument();
  });
});
