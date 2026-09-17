import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StackedAreaChart } from "../components/StackedAreaChart";

afterEach(cleanup);

describe("StackedAreaChart", () => {
  const series = [
    { label: "Free", values: [10, 15, 20] },
    { label: "Paid", values: [5, 8, 12] },
  ];
  const xLabels = ["Jan", "Feb", "Mar"];

  it("renders a real svg with an accessible name from title", () => {
    render(<StackedAreaChart series={series} xLabels={xLabels} title="Signups" />);
    expect(screen.getByRole("img", { name: "Signups" })).toBeInTheDocument();
  });

  it("renders one filled polygon band per series", () => {
    const { container } = render(<StackedAreaChart series={series} xLabels={xLabels} title="Signups" />);
    expect(container.querySelectorAll("polygon")).toHaveLength(2);
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<StackedAreaChart series={[]} xLabels={[]} title="Signups" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders a filter footer only when filterable is set, hiding a band on toggle", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    const { container } = render(<StackedAreaChart series={series} xLabels={xLabels} title="Signups" filterable />);
    expect(container.querySelectorAll("polygon")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Free" }));
    expect(container.querySelectorAll("polygon")).toHaveLength(1);
  });
});
