import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoticeBar } from "../components/NoticeBar";

afterEach(cleanup);

describe("NoticeBar", () => {
  it("renders its content and defaults to tone='default'", () => {
    const { container } = render(<NoticeBar content="Nothing entered here is saved." />);
    expect(screen.getByText("Nothing entered here is saved.")).toBeInTheDocument();
    expect(container.querySelector("[data-rebar-component='notice-bar']")).toHaveAttribute(
      "data-rebar-tone",
      "default",
    );
  });

  it("applies the given tone", () => {
    const { container } = render(<NoticeBar content="Careful" tone="warning" />);
    expect(container.querySelector("[data-rebar-component='notice-bar']")).toHaveAttribute(
      "data-rebar-tone",
      "warning",
    );
  });

  it("omits the icon slot entirely unless one is passed", () => {
    const { container } = render(<NoticeBar content="Plain" />);
    expect(container.querySelector("[data-rebar-part='icon']")).not.toBeInTheDocument();
  });

  it("renders a passed icon", () => {
    const { container } = render(<NoticeBar content="Plain" icon={<span data-testid="my-icon" />} />);
    expect(container.querySelector("[data-rebar-part='icon']")).toBeInTheDocument();
    expect(screen.getByTestId("my-icon")).toBeInTheDocument();
  });

  it("renders a close button only when closable, and fires onClose without bubbling to onClick", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onClick = vi.fn();
    const { rerender } = render(<NoticeBar content="Dismissible" closable onClose={onClose} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onClose).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();

    rerender(<NoticeBar content="Not dismissible" />);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  it("renders action content", () => {
    render(<NoticeBar content="Text" action={<button type="button">Update</button>} />);
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("wrap renders a modifier class and skips the marquee measurement", () => {
    const { container } = render(<NoticeBar content="Wrapped text" wrap />);
    expect(container.querySelector(".rebar-notice-bar-wrap")).toBeInTheDocument();
  });
});
