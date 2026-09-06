import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { toBionicSegments } from "../bionic";
import { Text } from "../components/Text";
import { Heading } from "../components/Heading";
import { Box } from "../components/Box";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-rebar-bionic");
});

describe("toBionicSegments", () => {
  it("bolds the first half (rounded up) of each eligible word by default", () => {
    // "Reading" is 7 chars, default fixationStrength 0.5 -> ceil(3.5) = 4
    expect(toBionicSegments("Reading")).toEqual([
      { text: "Read", style: "fixation" },
      { text: "ing", style: "rest" },
    ]);
  });

  it("leaves words at or below skipShortWords untouched", () => {
    // "a" (1) and "an" (2) stay plain; "the" (3) is eligible and splits at ceil(3*0.5)=2
    expect(toBionicSegments("a an the", { skipShortWords: 2 })).toEqual([
      { text: "a", style: "plain" },
      { text: " ", style: "plain" },
      { text: "an", style: "plain" },
      { text: " ", style: "plain" },
      { text: "th", style: "fixation" },
      { text: "e", style: "rest" },
    ]);
  });

  it("only bolds every Nth word per saccadeFrequency", () => {
    const segments = toBionicSegments("alpha beta gamma delta", { saccadeFrequency: 2 });
    // word indices 0,1,2,3 -> only 0 and 2 ("alpha", "gamma") are eligible
    const fixationWords = segments.filter((s) => s.style === "fixation").map((s) => s.text);
    expect(fixationWords.length).toBeGreaterThan(0);
    expect(segments.some((s) => s.text === "beta" && s.style === "plain")).toBe(true);
    expect(segments.some((s) => s.text === "delta" && s.style === "plain")).toBe(true);
  });

  it("preserves punctuation and whitespace as untouched plain segments", () => {
    const segments = toBionicSegments("Hello, world!");
    const joined = segments.map((s) => s.text).join("");
    expect(joined).toBe("Hello, world!");
    expect(segments.some((s) => s.text === ", " && s.style === "plain")).toBe(true);
  });

  it("handles unicode letters (accented characters)", () => {
    const segments = toBionicSegments("café résumé");
    expect(segments.map((s) => s.text).join("")).toBe("café résumé");
  });
});

describe("Text and Heading bionic support", () => {
  it("renders plain text unchanged when bionic is off (the default)", () => {
    const { container } = render(<Text>Reading practice</Text>);
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
    expect(container.textContent).toBe("Reading practice");
  });

  it("splits into fixation/rest spans when the bionic prop is set", () => {
    const { container } = render(<Text bionic>Reading</Text>);
    expect(container.querySelector(".rebar-bionic-fixation")).toHaveTextContent("Read");
    expect(container.querySelector(".rebar-bionic-rest")).toHaveTextContent("ing");
    expect(container.textContent).toBe("Reading");
  });

  it("follows the ambient data-rebar-bionic attribute when no explicit prop is set", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<Heading level={2}>Reading</Heading>);
    expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
  });

  it("lets an explicit bionic={false} override an ambient true setting", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<Text bionic={false}>Reading</Text>);
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
  });

  it("passes a lone element child through untouched even when bionic is on", () => {
    const { container } = render(
      <Text bionic>
        <strong>Bold already</strong>
      </Text>,
    );
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("Bold already");
  });

  it("still splits the plain-text portions of mixed string+element children (the common real-prose case)", () => {
    const { container } = render(
      <Text bionic>
        Some <strong>bold</strong> reading practice.
      </Text>,
    );
    // the plain-text runs around <strong> get bionic-split...
    expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
    // ...but <strong>'s own content is left exactly as authored, not recursed into
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("strong .rebar-bionic-fixation")).not.toBeInTheDocument();
    expect(container.textContent).toBe("Some bold reading practice.");
  });

  it("Box, the generic escape-hatch primitive, also follows bionic (e.g. table cells built from Box as='...')", () => {
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    const { container } = render(<Box as="span">Revisions</Box>);
    expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument();
  });

  it("doesn't remount a non-string child (losing its own internal state) when ambient bionic toggles on", async () => {
    // Real, hit-directly bug: Children.map (used to split string children) re-keys every child
    // it processes, even ones it leaves untouched — calling it unconditionally the moment bionic
    // turns on silently changed a non-string child's React key, so React treated it as a new
    // element and remounted it, discarding whatever internal state it had (e.g. closed an open
    // popover). A stateful counter child proves identity survives the toggle: its count must not
    // reset to 0.
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          {count}
        </button>
      );
    }

    document.documentElement.removeAttribute("data-rebar-bionic");
    const { container } = render(
      <div>
        <Box>
          <Counter />
        </Box>
        {/* A sibling that DOES visibly react to the ambient flip — the sync point this test
            waits on, confirming useAmbientBionic's MutationObserver actually fired (a plain
            rerender() right after setAttribute wouldn't, since the hook's own state updates
            asynchronously — exactly why the original repro needed a real DOM mutation to surface,
            not a synchronous rerender). */}
        <Text>Reading</Text>
      </div>,
    );
    fireEvent.click(container.querySelector("button")!);
    expect(container.querySelector("button")).toHaveTextContent("1");

    document.documentElement.setAttribute("data-rebar-bionic", "true");
    await waitFor(() => expect(container.querySelector(".rebar-bionic-fixation")).toBeInTheDocument());
    expect(container.querySelector("button")).toHaveTextContent("1");
  });

  it("never bionic-splits code/syntax content, even with bionic forced on", () => {
    const { container } = render(
      <Box as="code" bionic>
        const revisions = 42;
      </Box>,
    );
    expect(container.querySelector(".rebar-bionic-fixation")).not.toBeInTheDocument();
    expect(container.textContent).toBe("const revisions = 42;");
  });
});
