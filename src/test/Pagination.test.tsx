import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../components/Pagination";

afterEach(cleanup);

describe("Pagination", () => {
  it("renders a real nav landmark with aria-current on the active page", () => {
    render(<Pagination current={3} total={5} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
  });

  it("disables Previous on the first page and Next on the last", () => {
    const { rerender } = render(<Pagination current={1} total={5} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    rerender(<Pagination current={5} total={5} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("collapses a large page range to first/last/current±1 plus ellipses", () => {
    render(<Pagination current={10} total={20} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 20" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 11" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page 5" })).not.toBeInTheDocument();
  });

  it("calls onChange with the target page", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination current={3} total={5} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Page 4" }));
    expect(onChange).toHaveBeenCalledWith(4);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  // Regression test: `current` used to be a required prop with no uncontrolled fallback at all,
  // the only stateful component in this library that broke the Framework Rule requiring every one
  // to support both controlled and uncontrolled use.
  it("manages its own page when uncontrolled (no current prop)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination total={5} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("respects defaultCurrent when uncontrolled", () => {
    render(<Pagination total={5} defaultCurrent={3} />);
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
  });

  it("stays fully controlled when current is passed — internal state never overrides it", async () => {
    const user = userEvent.setup();
    render(<Pagination current={1} total={5} />);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    // No onChange handler applying the change back — controlled means the caller decides, so it
    // must stay on page 1.
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  });
});
