import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { DiffViewer } from "../components/DiffViewer";

describe("DiffViewer", () => {
  it("carries data-rebar-component and data-rebar-mode on the root", () => {
    render(<DiffViewer oldText="a" newText="b" />);
    const root = document.querySelector('[data-rebar-component="diff-viewer"]');
    expect(root).toHaveAttribute("data-rebar-mode", "split");
  });

  it("marks every line same when the texts are identical", () => {
    render(<DiffViewer oldText={"a\nb\nc"} newText={"a\nb\nc"} mode="unified" />);
    const lines = document.querySelectorAll('[data-rebar-part="line"]');
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toHaveAttribute("data-rebar-line-type", "same");
  });

  it("detects a pure addition without disturbing surrounding same lines", () => {
    render(<DiffViewer oldText={"a\nc"} newText={"a\nb\nc"} mode="unified" />);
    const lines = Array.from(document.querySelectorAll('[data-rebar-part="line"]'));
    const types = lines.map((l) => l.getAttribute("data-rebar-line-type"));
    expect(types).toEqual(["same", "add", "same"]);
  });

  it("detects a pure removal", () => {
    render(<DiffViewer oldText={"a\nb\nc"} newText={"a\nc"} mode="unified" />);
    const types = Array.from(document.querySelectorAll('[data-rebar-part="line"]')).map((l) =>
      l.getAttribute("data-rebar-line-type"),
    );
    expect(types).toEqual(["same", "remove", "same"]);
  });

  it("uses the real LCS alignment, not a naive index comparison — an insertion doesn't cascade into marking every later line changed", () => {
    render(<DiffViewer oldText={"one\ntwo\nthree\nfour"} newText={"zero\none\ntwo\nthree\nfour"} mode="unified" />);
    const types = Array.from(document.querySelectorAll('[data-rebar-part="line"]')).map((l) =>
      l.getAttribute("data-rebar-line-type"),
    );
    expect(types).toEqual(["add", "same", "same", "same", "same"]);
  });

  it("renders two labeled columns in split mode", () => {
    render(<DiffViewer oldText="a" newText="b" mode="split" oldLabel="Old" newLabel="New" />);
    const labels = Array.from(document.querySelectorAll('[data-rebar-part="column-label"]')).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(["Old", "New"]);
  });

  it("leaves the opposite column blank for an add/remove line in split mode", () => {
    render(<DiffViewer oldText={"a\nc"} newText={"a\nb\nc"} mode="split" />);
    const oldColumnLines = document.querySelectorAll('[data-rebar-part="column-old"] [data-rebar-part="line"]');
    expect(oldColumnLines[1]).toHaveAttribute("data-rebar-line-type", "empty");
  });
});
