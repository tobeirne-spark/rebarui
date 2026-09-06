import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinInput } from "../components/PinInput";

afterEach(cleanup);

describe("PinInput", () => {
  it("renders one input box per digit, in a labeled group", () => {
    render(<PinInput length={4} />);
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("auto-advances focus to the next box as each digit is typed", async () => {
    const user = userEvent.setup();
    render(<PinInput length={4} />);
    const boxes = screen.getAllByRole("textbox");
    await user.type(boxes[0]!, "1");
    expect(boxes[1]).toHaveFocus();
    await user.type(boxes[1]!, "2");
    expect(boxes[2]).toHaveFocus();
  });

  it("calls onComplete once every digit is filled", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput length={3} onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox");
    await user.type(boxes[0]!, "1");
    await user.type(boxes[1]!, "2");
    expect(onComplete).not.toHaveBeenCalled();
    await user.type(boxes[2]!, "3");
    expect(onComplete).toHaveBeenCalledWith("123");
  });

  it("splits a pasted code across every box", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput length={4} onComplete={onComplete} />);
    const boxes = screen.getAllByRole("textbox");
    boxes[0]!.focus();
    await user.paste("1234");
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("moves focus to the previous box on Backspace from an empty one", async () => {
    const user = userEvent.setup();
    render(<PinInput length={3} />);
    const boxes = screen.getAllByRole("textbox");
    await user.type(boxes[0]!, "1");
    expect(boxes[1]).toHaveFocus();
    await user.keyboard("{Backspace}");
    expect(boxes[0]).toHaveFocus();
  });
});
