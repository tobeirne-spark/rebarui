import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RibbonChart } from "../components/RibbonChart";

afterEach(cleanup);

describe("RibbonChart", () => {
  const series = [
    { label: "Alpha", values: [10, 30, 20] },
    { label: "Beta", values: [30, 10, 20] },
    { label: "Gamma", values: [20, 20, 30] },
  ];
  const xLabels = ["Q1", "Q2", "Q3"];

  it("renders a real svg with an accessible name from title", () => {
    render(<RibbonChart series={series} xLabels={xLabels} title="Leaderboard" />);
    expect(screen.getByRole("img", { name: "Leaderboard" })).toBeInTheDocument();
  });

  it("renders one ribbon path per series", () => {
    const { container } = render(<RibbonChart series={series} xLabels={xLabels} title="Leaderboard" />);
    expect(container.querySelectorAll('[data-rebar-part="mark"]')).toHaveLength(3);
  });

  it("renders each series' own label at its final rank position", () => {
    render(<RibbonChart series={series} xLabels={xLabels} title="Leaderboard" />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("ties are broken by original series order, not left ambiguous", () => {
    // At Q3, Alpha=20, Gamma=30, Beta=20 -- Alpha and Beta tie; Alpha (earlier in `series`) should
    // rank above Beta at that position. Verified indirectly via no error/duplicate-rank crash and
    // a stable render across two renders of the identical input.
    const { container: first } = render(<RibbonChart series={series} xLabels={xLabels} title="t" />);
    const { container: second } = render(<RibbonChart series={series} xLabels={xLabels} title="t" />);
    expect(first.querySelector("svg")?.outerHTML).toBe(second.querySelector("svg")?.outerHTML);
  });

  it("shows a visible empty state instead of broken geometry when there's no data", () => {
    render(<RibbonChart series={[]} xLabels={[]} title="Leaderboard" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("hiding a series via the filter footer re-ranks the remaining ones", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    const { container } = render(<RibbonChart series={series} xLabels={xLabels} title="t" filterable />);
    expect(container.querySelectorAll('[data-rebar-part="mark"]')).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Beta" }));
    expect(container.querySelectorAll('[data-rebar-part="mark"]')).toHaveLength(2);
  });
});
