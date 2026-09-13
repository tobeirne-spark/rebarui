import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";
import { Heading } from "./Heading";
import { Text } from "./Text";

describe("AppShell", () => {
  it("renders sidebar variant with correct structure", () => {
    render(
      <AppShell
        sidebar={{
          items: [{ label: "Home", href: "/" }],
          header: <Heading level={3}>Test App</Heading>,
        }}
      >
        <Text>Main content</Text>
      </AppShell>,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveAttribute("data-rebar-variant", "sidebar");
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("renders top-nav variant with correct structure", () => {
    render(
      <AppShell
        topNav={{
          items: [{ label: "Home", href: "/" }],
        }}
        variant="top-nav"
      >
        <Text>Page content</Text>
      </AppShell>,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveAttribute("data-rebar-variant", "top-nav");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("applies custom height prop", () => {
    render(
      <AppShell
        sidebar={{
          items: [{ label: "Home", href: "/" }],
        }}
        height="800px"
      >
        <Text>Content</Text>
      </AppShell>,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveStyle({ height: "800px" });
  });

  it("defaults to 100vh height", () => {
    render(
      <AppShell
        sidebar={{
          items: [{ label: "Home", href: "/" }],
        }}
      >
        <Text>Content</Text>
      </AppShell>,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveStyle({ height: "100vh" });
  });

  it("renders bare variant when no sidebar or topNav provided", () => {
    render(
      <AppShell>
        <Text>Bare content</Text>
      </AppShell>,
    );

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-rebar-variant", "bare");
    expect(screen.getByText("Bare content")).toBeInTheDocument();
  });

  it("forwards className and other props", () => {
    render(
      <AppShell
        sidebar={{
          items: [{ label: "Home", href: "/" }],
        }}
        className="custom-class"
        data-testid="custom-shell"
      >
        <Text>Content</Text>
      </AppShell>,
    );

    const shell = screen.getByTestId("custom-shell");
    expect(shell).toHaveClass("custom-class");
  });
});
