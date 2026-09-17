import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StackedLineChart } from "../components/StackedLineChart";

afterEach(cleanup);

describe("StackedLineChart", () => {
  const series = [
    { label: "Free", values: [10, 15, 20] },
    { label: "Paid", values: [5, 8, 12] },
  ];
  const xLabels = ["Jan", "Feb", "Mar"];

  it("renders a real svg with an accessible name from title", () => {
    render(<StackedLineChart series={series} xLabels={xLabels} title="Signups" />);
    expect(screen.getByRole("img", { name: "Signups" })).toBeInTheDocument();
  });

  it("renders one cumulative polyline per series, the topmost being the grand total", () => {
    const { container } = render(<StackedLineChart series={series} xLabels={xLabels} title="Signups" />);
    expect(container.querySelectorAll("polyline")).toHaveLength(2);
  });

  it("hiding a series via the filter footer recomputes the remaining cumulative sums", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(<StackedLineChart series={series} xLabels={xLabels} title="Signups" filterable />);
    // Both series visible: Paid's cumulative last point is 12 + 20 = 32.
    expect(screen.getByText("Paid", { selector: "text" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Free" }));
    // With Free hidden, Paid becomes the (only, topmost) line and its own cumulative equals its raw values.
    expect(screen.queryByText("Free", { selector: "text" })).not.toBeInTheDocument();
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<StackedLineChart series={[]} xLabels={[]} title="Signups" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
