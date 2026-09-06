import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GitGraph } from "../components/GitGraph";
import type { GitGraphCommit } from "../components/GitGraph";

const LINEAR_COMMITS: GitGraphCommit[] = [
  { id: "a1", parentIds: [], branch: "main", message: "Initial commit" },
  { id: "a2", parentIds: ["a1"], branch: "main", message: "Second commit" },
  { id: "a3", parentIds: ["a2"], branch: "main", message: "Third commit" },
];

const MERGE_COMMITS: GitGraphCommit[] = [
  { id: "a1", parentIds: [], branch: "main", message: "Initial commit" },
  { id: "a2", parentIds: ["a1"], branch: "main", message: "Second commit" },
  { id: "b1", parentIds: ["a1"], branch: "feature", message: "Start feature" },
  { id: "b2", parentIds: ["b1"], branch: "feature", message: "Finish feature" },
  { id: "a3", parentIds: ["a2", "b2"], branch: "main", message: "Merge feature into main", author: "Tom" },
];

describe("GitGraph", () => {
  it("carries data-rebar-component on the root", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} />);
    expect(container.querySelector('[data-rebar-component="git-graph"]')).not.toBeNull();
  });

  it("renders exactly one commit dot per commit", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} />);
    const dots = container.querySelectorAll('[data-rebar-part="commit-dot"]');
    expect(dots).toHaveLength(LINEAR_COMMITS.length);
  });

  it("draws one connector from a normal commit to its single parent", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} />);
    const connectors = container.querySelectorAll('[data-rebar-part="connector"]');
    // Two connectors expected: a2->a1, a3->a2 (the root a1 has no parent, so no connector for it).
    expect(connectors).toHaveLength(2);
    const a2ToA1 = container.querySelector('[data-rebar-part="connector"][data-from="a2"][data-to="a1"]');
    expect(a2ToA1).not.toBeNull();
    // Same branch/column -> straight line ("L"), not a curve ("C").
    expect(a2ToA1?.getAttribute("d")).toMatch(/^M [\d.]+,[\d.]+ L /);
  });

  it("draws two connector paths for a merge commit, one per parent", () => {
    const { container } = render(<GitGraph commits={MERGE_COMMITS} />);
    const mergeConnectors = container.querySelectorAll('[data-rebar-part="connector"][data-from="a3"]');
    expect(mergeConnectors).toHaveLength(2);
    const toMain = container.querySelector('[data-rebar-part="connector"][data-from="a3"][data-to="a2"]');
    const toFeature = container.querySelector('[data-rebar-part="connector"][data-from="a3"][data-to="b2"]');
    expect(toMain).not.toBeNull();
    expect(toFeature).not.toBeNull();
    // a3 and a2 share the "main" column -> straight line.
    expect(toMain?.getAttribute("d")).toMatch(/ L /);
    // a3 (main) and b2 (feature) sit in different columns -> curved bezier connector.
    expect(toFeature?.getAttribute("d")).toMatch(/ C /);
  });

  it("silently skips a connector whose parent id isn't present in commits", () => {
    const withDangling: GitGraphCommit[] = [
      { id: "z1", parentIds: ["does-not-exist"], branch: "main", message: "Orphaned parent ref" },
    ];
    const { container } = render(<GitGraph commits={withDangling} />);
    expect(container.querySelectorAll('[data-rebar-part="connector"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-rebar-part="commit-dot"]')).toHaveLength(1);
  });

  it("assigns distinct colors to different branches, deterministically across renders", () => {
    const first = render(<GitGraph commits={MERGE_COMMITS} />);
    const mainDot1 = first.container.querySelector('[data-branch="main"] [data-rebar-part="commit-dot"]');
    const featureDot1 = first.container.querySelector('[data-branch="feature"] [data-rebar-part="commit-dot"]');
    const mainColor1 = mainDot1?.getAttribute("fill");
    const featureColor1 = featureDot1?.getAttribute("fill");

    expect(mainColor1).toBeTruthy();
    expect(featureColor1).toBeTruthy();
    expect(mainColor1).not.toBe(featureColor1);

    const second = render(<GitGraph commits={MERGE_COMMITS} />);
    const mainDot2 = second.container.querySelector('[data-branch="main"] [data-rebar-part="commit-dot"]');
    const featureDot2 = second.container.querySelector('[data-branch="feature"] [data-rebar-part="commit-dot"]');
    expect(mainDot2?.getAttribute("fill")).toBe(mainColor1);
    expect(featureDot2?.getAttribute("fill")).toBe(featureColor1);
  });

  it("respects an explicit branchColors override", () => {
    const { container } = render(
      <GitGraph commits={LINEAR_COMMITS} branchColors={{ main: "var(--rebar-color-danger, #d32f2f)" }} />,
    );
    const dot = container.querySelector('[data-branch="main"] [data-rebar-part="commit-dot"]');
    expect(dot?.getAttribute("fill")).toBe("var(--rebar-color-danger, #d32f2f)");
  });

  it("shows a real visible text label (short hash + first line of message) per commit, not just a tooltip", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} />);
    const labels = container.querySelectorAll('[data-rebar-part="commit-label"]');
    expect(labels).toHaveLength(LINEAR_COMMITS.length);
    const firstLabelText = labels[0]?.textContent ?? "";
    expect(firstLabelText).toContain("a1");
    expect(firstLabelText).toContain("Initial commit");
    // The visible label is real text content on the label itself, not only inside a <title> tag.
    expect(labels[0]?.querySelector("title")).toBeNull();
  });

  it("still includes a <title> tooltip on each commit dot", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} />);
    const dot = container.querySelector('[data-commit-id="a2"] [data-rebar-part="commit-dot"]');
    expect(dot?.querySelector("title")?.textContent).toContain("Second commit");
  });

  it("truncates a long first message line but keeps the full message in the accessible list", () => {
    const longMessage = "A".repeat(80);
    const { container } = render(
      <GitGraph commits={[{ id: "z1", parentIds: [], branch: "main", message: longMessage }]} />,
    );
    const label = container.querySelector('[data-rebar-part="commit-label"]');
    expect(label?.textContent?.length ?? 0).toBeLessThan(longMessage.length);
    const listItem = container.querySelector('[data-rebar-part="accessible-list"] li');
    expect(listItem?.textContent).toContain(longMessage);
  });

  it("renders the real Empty component instead of a blank canvas when commits is empty", () => {
    const { container } = render(<GitGraph commits={[]} />);
    expect(container.querySelector('[data-rebar-component="empty"]')).not.toBeNull();
    // No chart canvas at all — not even the role="img" svg (Empty's own decorative fallback icon
    // is itself a small <svg>, so asserting "no svg anywhere" would be a false positive here).
    expect(container.querySelector('svg[role="img"]')).toBeNull();
    expect(container.querySelector('[data-rebar-part="commits"]')).toBeNull();
  });

  it("renders a title as a visible figcaption", () => {
    const { getByText } = render(<GitGraph commits={LINEAR_COMMITS} title="Repo history" />);
    expect(getByText("Repo history")).toBeInTheDocument();
  });

  it("provides a visually-hidden accessible list alongside the graph", () => {
    const { container } = render(<GitGraph commits={MERGE_COMMITS} />);
    const list = container.querySelector('[data-rebar-part="accessible-list"]');
    expect(list).not.toBeNull();
    expect(list?.classList.contains("rebar-visually-hidden")).toBe(true);
    expect(list?.querySelectorAll("li")).toHaveLength(MERGE_COMMITS.length);
    expect(list?.textContent).toContain("Merge feature into main");
    expect(list?.textContent).toContain("Tom");
  });

  it("computes a default aria-label summarizing commit and branch counts", () => {
    const { container } = render(<GitGraph commits={MERGE_COMMITS} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-label")).toBe("Git history: 5 commits across 2 branches");
  });

  it("supports an explicit ariaLabel override", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} ariaLabel="Custom label" />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Custom label");
  });

  it("forwards arbitrary data-* / aria-* props onto the root", () => {
    const { container } = render(<GitGraph commits={LINEAR_COMMITS} data-testid="my-graph" aria-describedby="foo" />);
    const root = container.querySelector('[data-rebar-component="git-graph"]');
    expect(root).toHaveAttribute("data-testid", "my-graph");
    expect(root).toHaveAttribute("aria-describedby", "foo");
  });
});
