import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneInput } from "../components/PhoneInput";

describe("PhoneInput", () => {
  it("carries data-rebar-component on the root", () => {
    render(<PhoneInput />);
    expect(document.querySelector('[data-rebar-component="phone-input"]')).not.toBeNull();
  });

  it("defaults to the first country in the list", () => {
    render(<PhoneInput />);
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent("United States");
  });

  it("applies the selected country's mask to the national number field", async () => {
    const user = userEvent.setup();
    render(<PhoneInput />);
    const national = screen.getByRole("textbox", { name: "Phone number" });
    await user.type(national, "5551234567");
    expect(national).toHaveValue("(555) 123-4567");
  });

  it("emits the combined dial code + national number on change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PhoneInput onValueChange={onValueChange} />);
    await user.type(screen.getByRole("textbox", { name: "Phone number" }), "5");
    expect(onValueChange).toHaveBeenLastCalledWith("+1 (5");
  });

  it("switches the mask when a different country is chosen", async () => {
    const user = userEvent.setup();
    render(<PhoneInput />);
    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(await screen.findByRole("option", { name: /Germany/ }));
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent("Germany");
    const national = screen.getByRole("textbox", { name: "Phone number" });
    await user.type(national, "1512345");
    // Germany has no built-in mask — digits pass through unformatted.
    expect(national).toHaveValue("1512345");
  });

  it("parses an initial defaultValue into the matching country and national number", () => {
    render(<PhoneInput defaultValue="+44 7911 123456" />);
    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent("United Kingdom");
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue("7911 123456");
  });

  it("disables both the country select and the national field when disabled", () => {
    render(<PhoneInput disabled />);
    expect(screen.getByRole("combobox", { name: "Country" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Phone number" })).toBeDisabled();
  });
});
