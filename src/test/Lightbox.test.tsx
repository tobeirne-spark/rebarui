import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Lightbox } from "../components/Lightbox";

describe("Lightbox", () => {
  it("carries data-rebar-component on the root", () => {
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" />);
    expect(document.querySelector('[data-rebar-component="lightbox"]')).not.toBeNull();
  });

  it("renders the image itself as the default trigger, at thumbnail size", () => {
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" />);
    const thumbnail = document.querySelector('[data-rebar-part="thumbnail"]') as HTMLImageElement;
    expect(thumbnail).not.toBeNull();
    expect(thumbnail).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the fullscreen dialog with the full image on click", async () => {
    const user = userEvent.setup();
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" />);

    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("rebar-dialog-content-fullscreen");
    const fullImage = dialog.querySelector('[data-rebar-part="image"]');
    expect(fullImage).not.toBeNull();
    expect(fullImage).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("closes via the real Dialog close button, with no second close button added", async () => {
    const user = userEvent.setup();
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" />);

    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" />);

    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports a custom trigger", async () => {
    const user = userEvent.setup();
    render(
      <Lightbox
        src="https://example.com/photo.jpg"
        alt="A photo"
        trigger={<button type="button">View photo</button>}
      />,
    );
    expect(document.querySelector('[data-rebar-part="thumbnail"]')).toBeNull();
    await user.click(screen.getByRole("button", { name: "View photo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays controlled — a controlled `open` doesn't self-manage without the caller updating it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Uncooperative() {
      // Deliberately does NOT update `open` in response to onOpenChange, to prove the Dialog
      // underneath does not self-manage when it's given a controlled `open` prop.
      const [open] = useState(false);
      return (
        <Lightbox src="https://example.com/photo.jpg" alt="A photo" open={open} onOpenChange={onOpenChange} />
      );
    }
    render(<Uncooperative />);

    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Still closed, since the caller's own state never changed.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("controlled `open` usage: caller-driven state opens and closes the dialog", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Lightbox src="https://example.com/photo.jpg" alt="A photo" open={open} onOpenChange={setOpen} />
      );
    }
    render(<Controlled />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders no action buttons when no action props are supplied", async () => {
    const user = userEvent.setup();
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" />);
    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));
    expect(document.querySelector('[data-rebar-part="actions"]')).toBeNull();
  });

  it("shows only the action buttons whose callback was actually supplied", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onDelete = vi.fn();
    render(<Lightbox src="https://example.com/photo.jpg" alt="A photo" onCopy={onCopy} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));

    expect(screen.getByRole("button", { name: "Copy image" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete image" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move image" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download image" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument();
  });

  it("fires the copy/delete/move/download callbacks on click", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onDelete = vi.fn();
    const onMove = vi.fn();
    const onDownload = vi.fn();
    render(
      <Lightbox
        src="https://example.com/photo.jpg"
        alt="A photo"
        onCopy={onCopy}
        onDelete={onDelete}
        onMove={onMove}
        onDownload={onDownload}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));

    await user.click(screen.getByRole("button", { name: "Copy image" }));
    await user.click(screen.getByRole("button", { name: "Delete image" }));
    await user.click(screen.getByRole("button", { name: "Move image" }));
    await user.click(screen.getByRole("button", { name: "Download image" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("renders caller-supplied moreActions in a real Dropdown menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Lightbox
        src="https://example.com/photo.jpg"
        alt="A photo"
        moreActions={[{ key: "report", label: "Report image", onSelect }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open full image: A photo" }));

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const item = await screen.findByText("Report image");
    await user.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
