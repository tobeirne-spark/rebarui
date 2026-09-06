import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "../components/Alert";

describe("Alert", () => {
  it("uses an assertive role for errors so screen readers announce them immediately", () => {
    render(<Alert type="error" title="Email is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("uses a polite status role for non-urgent alert types", () => {
    render(<Alert type="success" title="Saved" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("marks title and description as distinct parts for styling/testing", () => {
    render(
      <Alert type="error" title="Email is required">
        Please enter your email address to continue.
      </Alert>,
    );
    expect(screen.getByText("Email is required")).toHaveAttribute(
      "data-rebar-part",
      "title",
    );
    expect(
      screen.getByText("Please enter your email address to continue."),
    ).toHaveAttribute("data-rebar-part", "description");
  });
});
