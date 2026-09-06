import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Carousel } from "../components/Carousel";

function slides(count: number) {
  return Array.from({ length: count }, (_, i) => <div key={i}>Slide {i + 1}</div>);
}

describe("Carousel", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Carousel>{slides(3)}</Carousel>);
    expect(document.querySelector('[data-rebar-component="carousel"]')).not.toBeNull();
  });

  it("shows the first slide and status by default", () => {
    render(<Carousel>{slides(3)}</Carousel>);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("advances on next and disables next at the last slide", () => {
    render(<Carousel>{slides(2)}</Carousel>);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
  });

  it("disables previous at the first slide", () => {
    render(<Carousel>{slides(2)}</Carousel>);
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
  });

  it("jumps to a slide via its dot", () => {
    render(<Carousel>{slides(3)}</Carousel>);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
  });

  it("navigates with arrow keys", () => {
    render(<Carousel>{slides(3)}</Carousel>);
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowLeft" });
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("hides non-active slides from assistive tech", () => {
    render(<Carousel>{slides(2)}</Carousel>);
    const groups = screen.getAllByRole("group", { hidden: true });
    expect(groups[0]).toHaveAttribute("aria-hidden", "false");
    expect(groups[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("supports controlled index with onIndexChange", () => {
    const onIndexChange = vi.fn();
    render(
      <Carousel index={0} onIndexChange={onIndexChange}>
        {slides(2)}
      </Carousel>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});
