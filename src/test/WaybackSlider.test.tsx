import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaybackSlider } from "../components/WaybackSlider";

afterEach(cleanup);

const DATES = [new Date(2026, 0, 1), new Date(2026, 1, 1), new Date(2026, 2, 1)];

describe("WaybackSlider", () => {
  it("defaults to the latest date, showing the Latest badge", () => {
    const { container } = render(<WaybackSlider dates={DATES} />);
    expect(container.querySelector('[data-rebar-part="current-date"]')).toHaveTextContent("Mar 1, 2026");
    expect(screen.getByText("Latest")).toBeInTheDocument();
  });

  it("defaultValue picks a specific starting snapshot, no Latest badge", () => {
    const { container } = render(<WaybackSlider dates={DATES} defaultValue={DATES[0]} />);
    expect(container.querySelector('[data-rebar-part="current-date"]')).toHaveTextContent("Jan 1, 2026");
    expect(screen.queryByText("Latest")).not.toBeInTheDocument();
  });

  it("moving the slider left fires onValueChange with the earlier snapshot's real date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<WaybackSlider dates={DATES} onValueChange={onValueChange} />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenCalledWith(DATES[1]);
  });

  it("is controlled when value is passed — moving the slider doesn't change the shown date without the caller feeding it back", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<WaybackSlider dates={DATES} value={DATES[2]} onValueChange={onValueChange} />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenCalledWith(DATES[1]);
    // Still showing the caller's own unchanged value.
    expect(container.querySelector('[data-rebar-part="current-date"]')).toHaveTextContent("Mar 1, 2026");
  });

  it("uses a custom dateFormat when provided", () => {
    const { container } = render(
      <WaybackSlider dates={DATES} defaultValue={DATES[0]} dateFormat={(d) => `Y${d.getFullYear()}`} />,
    );
    expect(container.querySelector('[data-rebar-part="current-date"]')).toHaveTextContent("Y2026");
  });

  it("renders nothing when dates is empty", () => {
    const { container } = render(<WaybackSlider dates={[]} />);
    expect(container.querySelector('[data-rebar-component="wayback-slider"]')).not.toBeInTheDocument();
  });

  it("carries the expected data-rebar-component attribute", () => {
    const { container } = render(<WaybackSlider dates={DATES} />);
    expect(container.querySelector('[data-rebar-component="wayback-slider"]')).toBeInTheDocument();
  });
});
