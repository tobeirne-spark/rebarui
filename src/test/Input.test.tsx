import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../components/Input";

afterEach(cleanup);

describe("Input", () => {
  it("renders a real input with the expected data attributes", () => {
    render(<Input aria-label="Name" />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("data-rebar-component", "input");
    expect(input).toHaveAttribute("data-rebar-size", "md");
  });

  it("formats typed input against a digit mask, inserting literal characters automatically", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Phone" mask="(999) 999-9999" />);
    const input = screen.getByRole("textbox", { name: "Phone" }) as HTMLInputElement;
    await user.type(input, "5551234567");
    expect(input.value).toBe("(555) 123-4567");
  });

  it("skips a character that doesn't match the mask's digit placeholder, keeping valid ones", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Zip" mask="99999" />);
    const input = screen.getByRole("textbox", { name: "Zip" }) as HTMLInputElement;
    await user.type(input, "1a234");
    expect(input.value).toBe("1234");
  });

  it("without a mask, behaves like a plain controlled input", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Plain" />);
    const input = screen.getByRole("textbox", { name: "Plain" }) as HTMLInputElement;
    await user.type(input, "hello");
    expect(input.value).toBe("hello");
  });
});
