import { Children, useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Ported from NovelaHaus's CodeMirror bionic-reading plugin (bionicPlugin.js) — same word-
 * splitting math, re-expressed as a pure string->segments function instead of a CodeMirror
 * decoration builder, so it can render as plain React spans instead of editor decorations.
 */
export interface BionicOptions {
  /** Fraction (0-1) of each eligible word's characters to bold. */
  fixationStrength?: number;
  /** Bold every Nth word (1 = every word, 2 = every other, ...). */
  saccadeFrequency?: number;
  /** Words this length or shorter are left untouched. */
  skipShortWords?: number;
}

export const DEFAULT_BIONIC_OPTIONS: Required<BionicOptions> = {
  fixationStrength: 0.5,
  saccadeFrequency: 1,
  skipShortWords: 2,
};

export interface BionicSegment {
  text: string;
  /** "fixation" = bold, "rest" = dimmed remainder of a bolded word, "plain" = untouched. */
  style: "fixation" | "rest" | "plain";
}

const WORD_RE = /\p{L}+/gu;

export function toBionicSegments(text: string, options: BionicOptions = {}): BionicSegment[] {
  const { fixationStrength, saccadeFrequency, skipShortWords } = {
    ...DEFAULT_BIONIC_OPTIONS,
    ...options,
  };

  const segments: BionicSegment[] = [];
  let lastIndex = 0;
  let wordIndex = 0;
  let match: RegExpExecArray | null;
  WORD_RE.lastIndex = 0;

  while ((match = WORD_RE.exec(text)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), style: "plain" });
    }

    const eligible = word.length > skipShortWords && wordIndex % saccadeFrequency === 0;
    if (eligible) {
      const split = Math.ceil(word.length * fixationStrength);
      if (split > 0) segments.push({ text: word.slice(0, split), style: "fixation" });
      if (split < word.length) segments.push({ text: word.slice(split), style: "rest" });
    } else {
      segments.push({ text: word, style: "plain" });
    }

    wordIndex++;
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), style: "plain" });
  }

  return segments;
}

function readAmbientBionic(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-rebar-bionic") === "true";
}

/**
 * Mirrors the same "ambient DOM attribute, live-updated via MutationObserver" pattern dark mode
 * and sketch/clean theming already use (see RebarDevTools.tsx) — data-rebar-bionic="true" on
 * <html>, toggled globally, no Provider required.
 */
export function useAmbientBionic(): boolean {
  const [enabled, setEnabled] = useState(readAmbientBionic);

  useEffect(() => {
    const observer = new MutationObserver(() => setEnabled(readAmbientBionic()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-rebar-bionic"],
    });
    return () => observer.disconnect();
  }, []);

  return enabled;
}

function splitStringToNodes(text: string, options: BionicOptions | undefined, key: string): ReactNode {
  // Wrapped in a single plain <span>, not returned as a bare array of segment nodes — many
  // components render their text inside a flex/inline-flex container with `gap` (Button's own
  // icon-to-label spacing, for instance). `gap` inserts space between *every* direct child, so a
  // bare array of segments became several direct flex children of that container instead of one,
  // and the gap meant for spacing separate elements landed inside a single split word instead
  // ("Prim ary" instead of "Primary"). One wrapping element makes the whole run a single flex
  // item again, wherever it's placed — this fixes it generally rather than patching every
  // consuming component's CSS one at a time.
  return (
    <span key={key}>
      {toBionicSegments(text, options).map((segment, i) => {
        if (segment.style === "plain") return segment.text;
        const className = segment.style === "fixation" ? "rebar-bionic-fixation" : "rebar-bionic-rest";
        return (
          <span key={i} className={className}>
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}

/**
 * The one hook every text-bearing component wraps its string content with. `bionic` lets a
 * single instance force it on/off regardless of the ambient setting; otherwise it follows
 * data-rebar-bionic.
 *
 * Real prose is rarely a single bare string — `<Text>` children routinely mix plain text with
 * inline `<strong>`/`<em>`/`<code>` (e.g. `Some <strong>bold</strong> word.`), which JSX turns
 * into an array of children, not one string. An earlier version only handled the single-string
 * case and silently skipped anything mixed like that entirely — most real paragraphs on this
 * site never got bionic-formatted at all. Children.map walks each direct child: string children
 * are split, element children (icons, nested components, `<strong>`/`<em>`/`<code>` runs) pass
 * through completely untouched — this doesn't recurse *into* those elements' own children, so a
 * `<strong>` word's contents stay exactly as authored rather than risking its internal structure.
 *
 * Plain function, not a hook — safe to call from inside a .map() over a list prop (Breadcrumb
 * items, Steps items, etc.), where the list length can vary between renders and calling a hook
 * there would break the rules of hooks. Components with a variable-length list of text should
 * call useAmbientBionic() once at the top level, then call this per item.
 */
export function renderBionicChildren(
  children: ReactNode,
  enabled: boolean,
  options?: BionicOptions,
): ReactNode {
  if (!enabled) return children;

  if (typeof children === "string") {
    return splitStringToNodes(children, options, "bionic");
  }

  // A real bug, not just an optimization: Children.map re-keys every child it touches (React's
  // own documented behavior, to avoid key collisions across nested maps) — so calling it
  // unconditionally here, even when nothing among `children` is actually a string worth
  // splitting, silently changes the React key of every element child the moment bionic mode
  // toggles on. That makes React treat an unkeyed non-string child (a nested stateful component,
  // e.g. an open Popover) as a *different* element and remount it — losing its own state (a real,
  // hit-directly repro: a `Box`-wrapped popover with a bionic-reading toggle inside it closed
  // itself the instant that toggle flipped ambient bionic on, since flipping it made every
  // ambient-bionic `Box`/`Text` up the tree re-run this function and remount their children).
  // Skip Children.map entirely unless splitting is actually going to happen.
  const hasStringChild = Children.toArray(children).some((child) => typeof child === "string");
  if (!hasStringChild) return children;

  return Children.map(children, (child, index) =>
    typeof child === "string" ? splitStringToNodes(child, options, `bionic-${index}`) : child,
  );
}

/**
 * Convenience hook for a component with a fixed set of text props (a single title, a single
 * description, ...) — not for list items, see renderBionicChildren above.
 */
export function useBionicChildren(
  children: ReactNode,
  bionic?: boolean,
  options?: BionicOptions,
): ReactNode {
  const ambient = useAmbientBionic();
  const enabled = bionic ?? ambient;
  return renderBionicChildren(children, enabled, options);
}
