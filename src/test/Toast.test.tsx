import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast, ToastProvider } from "../components/Toast";

describe("Toast", () => {
  it("shows the title and description while open", () => {
    render(
      <ToastProvider>
        <Toast open title="Saved" description="Your changes were saved." />
      </ToastProvider>,
    );
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Your changes were saved.")).toBeInTheDocument();
  });

  it("closes when its close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ToastProvider>
        <Toast open title="Saved" onOpenChange={onOpenChange} />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("carries data-rebar-component and data-rebar-type", () => {
    render(
      <ToastProvider>
        <Toast open title="Something went wrong" type="error" />
      </ToastProvider>,
    );
    const toast = screen.getByText("Something went wrong").closest('[data-rebar-component="toast"]');
    expect(toast).toHaveAttribute("data-rebar-type", "error");
  });
});
