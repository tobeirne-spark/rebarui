import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../components/ThemeToggle";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-rebar-theme");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-rebar-bionic");
});

describe("ThemeToggle", () => {
  it("renders a data-rebar-component marker and a Theme trigger by default", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector('[data-rebar-component="theme-toggle"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
  });

  it("accepts a custom trigger label", () => {
    render(<ThemeToggle label="Appearance" />);
    expect(screen.getByRole("button", { name: "Appearance" })).toBeInTheDocument();
  });

  it("defaults the trigger to size sm, and forwards an explicit size override", () => {
    const { container, rerender } = render(<ThemeToggle />);
    expect(container.querySelector('[data-rebar-size="sm"]')).toBeInTheDocument();

    rerender(<ThemeToggle size="md" />);
    expect(container.querySelector('[data-rebar-size="md"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-size="sm"]')).not.toBeInTheDocument();
  });

  it("toggles data-rebar-theme between sketch and clean", async () => {
    const user = userEvent.setup();
    document.documentElement.removeAttribute("data-rebar-theme");
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Theme" }));

    await user.click(screen.getByRole("radio", { name: "Simple" }));
    expect(document.documentElement).toHaveAttribute("data-rebar-theme", "clean");

    await user.click(screen.getByRole("radio", { name: "Sketch" }));
    expect(document.documentElement).toHaveAttribute("data-rebar-theme", "sketch");
  });

  it("toggles data-theme between dark and (absent) light", async () => {
    const user = userEvent.setup();
    document.documentElement.removeAttribute("data-theme");
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Theme" }));

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    await user.click(screen.getByRole("radio", { name: "Light" }));
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("toggles data-rebar-bionic via the Bionic reading switch", async () => {
    const user = userEvent.setup();
    document.documentElement.removeAttribute("data-rebar-bionic");
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Theme" }));

    expect(screen.getByRole("switch", { name: "Bionic reading" })).not.toBeChecked();

    await user.click(screen.getByRole("switch", { name: "Bionic reading" }));
    expect(document.documentElement).toHaveAttribute("data-rebar-bionic", "true");
    expect(screen.getByRole("switch", { name: "Bionic reading" })).toBeChecked();

    await user.click(screen.getByRole("switch", { name: "Bionic reading" }));
    expect(document.documentElement).not.toHaveAttribute("data-rebar-bionic");
  });

  it("reflects whatever the host page already configured on mount, rather than assuming a default", () => {
    document.documentElement.setAttribute("data-rebar-theme", "clean");
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.setAttribute("data-rebar-bionic", "true");
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveAttribute("data-rebar-theme", "clean");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-rebar-bionic", "true");
  });
});
