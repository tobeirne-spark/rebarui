import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../components/Avatar";
import { hashString, resolvePlaceholderSrc } from "../components/avatarPlaceholder";
import { AVATAR_PLACEHOLDERS } from "../assets/avatarPlaceholders";

describe("Avatar", () => {
  it("shows the fallback initials (Radix defers the image until it loads, which jsdom never does)", () => {
    render(<Avatar src="https://example.com/avatar.png" alt="Ada Lovelace" fallback="AL" />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("carries data-rebar-component on the root", () => {
    render(<Avatar fallback="AL" />);
    expect(screen.getByText("AL").closest('[data-rebar-component="avatar"]')).not.toBeNull();
  });

  it("still shows the fallback when placeholder is set (jsdom can't load the resulting image either)", () => {
    render(<Avatar fallback="AL" placeholder />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("defaults data-rebar-size to md, and reflects an explicit size", () => {
    render(<Avatar fallback="AL" />);
    expect(screen.getByText("AL").closest('[data-rebar-component="avatar"]')).toHaveAttribute(
      "data-rebar-size",
      "md",
    );
  });

  it("forwards arbitrary data-*/aria-* props onto the root, per the framework's rest-spread rule", () => {
    render(<Avatar fallback="AL" size="lg" data-testid="my-avatar" aria-label="Ada Lovelace" />);
    const root = screen.getByTestId("my-avatar");
    expect(root).toHaveAttribute("data-rebar-size", "lg");
    expect(root).toHaveAttribute("aria-label", "Ada Lovelace");
  });
});

describe("resolvePlaceholderSrc", () => {
  it("returns undefined when placeholder is unset — no behavior change for existing usage", () => {
    expect(resolvePlaceholderSrc(undefined, "Ada Lovelace")).toBeUndefined();
    expect(resolvePlaceholderSrc(false, "Ada Lovelace")).toBeUndefined();
  });

  it("picks the same portrait for the same name every time (deterministic, not random)", () => {
    const a = resolvePlaceholderSrc(true, "Ada Lovelace");
    const b = resolvePlaceholderSrc(true, "Ada Lovelace");
    expect(a).toBe(b);
    expect(AVATAR_PLACEHOLDERS).toContain(a);
  });

  it("can pick different portraits for different names", () => {
    const names = ["Ada Lovelace", "Grace Hopper", "Katherine Johnson", "Margaret Hamilton"];
    const picks = new Set(names.map((n) => resolvePlaceholderSrc(true, n)));
    // Not a strict requirement that all 4 differ (hash collisions are possible), but with only
    // 8 slots and 4 names, getting exactly 1 unique value would indicate the hash isn't varying.
    expect(picks.size).toBeGreaterThan(1);
  });

  it("a numeric placeholder picks a specific portrait by index, wrapping via modulo", () => {
    expect(resolvePlaceholderSrc(0, "anything")).toBe(AVATAR_PLACEHOLDERS[0]);
    expect(resolvePlaceholderSrc(AVATAR_PLACEHOLDERS.length, "anything")).toBe(AVATAR_PLACEHOLDERS[0]);
  });
});

describe("hashString", () => {
  it("is deterministic and always non-negative", () => {
    expect(hashString("same")).toBe(hashString("same"));
    expect(hashString("")).toBeGreaterThanOrEqual(0);
    expect(hashString("anything at all")).toBeGreaterThanOrEqual(0);
  });
});
