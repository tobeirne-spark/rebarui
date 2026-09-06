import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tag } from "../components/Tag";

describe("Tag", () => {
  it("renders its label and default tone", () => {
    render(<Tag>Active</Tag>);
    expect(screen.getByText("Active")).toBeInTheDocument();
    const tag = screen.getByText("Active").closest("[data-rebar-component='tag']");
    expect(tag).toHaveAttribute("data-rebar-tone", "default");
  });

  it("reflects a tone prop", () => {
    render(<Tag tone="success">Done</Tag>);
    const tag = screen.getByText("Done").closest("[data-rebar-component='tag']");
    expect(tag).toHaveAttribute("data-rebar-tone", "success");
  });

  it("shows a close button and calls onClose when closable", async () => {
    const onClose = vi.fn();
    render(
      <Tag closable onClose={onClose}>
        Removable
      </Tag>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders no close button when not closable", () => {
    render(<Tag>Plain</Tag>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
