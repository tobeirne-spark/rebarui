import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberKeyboard } from "../components/NumberKeyboard";

afterEach(cleanup);

describe("NumberKeyboard", () => {
  it("renders as a real dialog with a 0-9 keypad plus delete", () => {
    render(<NumberKeyboard open onInput={() => {}} onDelete={() => {}} title="Enter PIN" />);
    const dialog = screen.getByRole("dialog", { name: "Enter PIN" });
    for (const digit of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
      expect(within(dialog).getByRole("button", { name: digit })).toBeInTheDocument();
    }
    expect(within(dialog).getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("tapping a digit fires onInput with that digit", async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();
    render(<NumberKeyboard open onInput={onInput} onDelete={() => {}} />);
    await user.click(screen.getByRole("button", { name: "7" }));
    expect(onInput).toHaveBeenCalledWith("7");
  });

  it("tapping delete fires onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<NumberKeyboard open onInput={() => {}} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("omits the confirm button entirely unless onConfirm is passed", () => {
    const { rerender } = render(<NumberKeyboard open onInput={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();

    rerender(<NumberKeyboard open onInput={() => {}} onDelete={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("confirming closes the keyboard by default (closeOnConfirm)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <NumberKeyboard open onOpenChange={onOpenChange} onInput={() => {}} onDelete={() => {}} onConfirm={onConfirm} />,
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closeOnConfirm=false keeps the keyboard open after confirming", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <NumberKeyboard
        open
        onOpenChange={onOpenChange}
        onInput={() => {}}
        onDelete={() => {}}
        onConfirm={() => {}}
        closeOnConfirm={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("renders a customKey in the bottom-left slot when passed", () => {
    render(<NumberKeyboard open onInput={() => {}} onDelete={() => {}} customKey="." />);
    expect(screen.getByRole("button", { name: "." })).toBeInTheDocument();
  });

  it("randomOrder still renders all ten digits exactly once (order not asserted)", () => {
    render(<NumberKeyboard open onInput={() => {}} onDelete={() => {}} randomOrder />);
    const dialog = screen.getByRole("dialog");
    const keys = within(dialog)
      .getAllByRole("button")
      .map((b) => b.textContent)
      .filter((t) => t && /^[0-9]$/.test(t));
    expect(keys.sort()).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });
});
