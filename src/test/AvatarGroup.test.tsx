import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvatarGroup } from "../components/AvatarGroup";

const AVATARS = [
  { fallback: "AA" },
  { fallback: "BB" },
  { fallback: "CC" },
  { fallback: "DD" },
  { fallback: "EE" },
  { fallback: "FF" },
  { fallback: "GG" },
];

describe("AvatarGroup", () => {
  it("renders every avatar with no overflow when the count is at or below max", () => {
    render(<AvatarGroup avatars={AVATARS.slice(0, 3)} max={5} />);
    expect(screen.getAllByText(/^[A-Z]{2}$/)).toHaveLength(3);
    expect(document.querySelector('[data-rebar-part="overflow"]')).not.toBeInTheDocument();
  });

  it("renders exactly max avatars plus one overflow avatar showing the correct +N count", () => {
    render(<AvatarGroup avatars={AVATARS} max={5} />);
    const items = document.querySelectorAll('[data-rebar-part="item"]');
    expect(items).toHaveLength(5);
    const overflow = document.querySelector('[data-rebar-part="overflow"]');
    expect(overflow).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("defaults max to 5", () => {
    render(<AvatarGroup avatars={AVATARS} />);
    expect(document.querySelectorAll('[data-rebar-part="item"]')).toHaveLength(5);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders real Avatar components, not reimplemented markup", () => {
    render(<AvatarGroup avatars={AVATARS} max={5} />);
    expect(document.querySelectorAll('[data-rebar-component="avatar"]').length).toBe(6); // 5 shown + 1 overflow
  });

  it("forwards size to every real Avatar, including the overflow one", () => {
    render(<AvatarGroup avatars={AVATARS} max={2} size="lg" />);
    const avatars = document.querySelectorAll('[data-rebar-component="avatar"]');
    expect(avatars.length).toBe(3); // 2 shown + 1 overflow
    avatars.forEach((el) => expect(el).toHaveAttribute("data-rebar-size", "lg"));
  });

  it("carries data-rebar-component on the root", () => {
    render(<AvatarGroup avatars={AVATARS} />);
    expect(document.querySelector('[data-rebar-component="avatar-group"]')).toBeInTheDocument();
  });
});
