import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadQueue } from "../components/UploadQueue";
import type { UploadQueueItem } from "../components/UploadQueue";

afterEach(cleanup);

const baseItems: UploadQueueItem[] = [
  { id: "1", name: "photo.png", progress: 40, status: "uploading" },
  { id: "2", name: "video.mp4", progress: 100, status: "done" },
];

describe("UploadQueue", () => {
  it("renders nothing when items is empty", () => {
    const { container } = render(<UploadQueue items={[]} />);
    expect(container.querySelector('[data-rebar-component="upload-queue"]')).not.toBeInTheDocument();
  });

  it("renders one row per item using the real Progress component", () => {
    render(<UploadQueue items={baseItems} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.getByText("video.mp4")).toBeInTheDocument();

    const progressBars = document.querySelectorAll('[data-rebar-component="progress"]');
    // "done" item still renders through Progress (at its own progress value); "error" items don't.
    expect(progressBars.length).toBe(2);
  });

  it("shows an overall summary when there's more than one item", () => {
    render(<UploadQueue items={baseItems} />);
    expect(screen.getByText("1 of 2 uploaded")).toBeInTheDocument();
  });

  it("shows no summary for a single item", () => {
    render(<UploadQueue items={[baseItems[0]!]} />);
    expect(screen.queryByText(/uploaded/)).not.toBeInTheDocument();
  });

  it("fires onPause with the right id from the uploading item's pause button", () => {
    const onPause = vi.fn();
    render(<UploadQueue items={baseItems} onPause={onPause} />);

    fireEvent.click(screen.getByLabelText("Pause photo.png"));

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledWith("1");
  });

  it("fires onResume with the right id from a paused item's resume button", () => {
    const onResume = vi.fn();
    const items: UploadQueueItem[] = [{ id: "3", name: "doc.pdf", progress: 60, status: "paused" }];
    render(<UploadQueue items={items} onResume={onResume} />);

    fireEvent.click(screen.getByLabelText("Resume doc.pdf"));

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledWith("3");
  });

  it("fires onRetry with the right id from an error item's retry button, and shows its error message", () => {
    const onRetry = vi.fn();
    const items: UploadQueueItem[] = [
      { id: "4", name: "bad.zip", progress: 0, status: "error", errorMessage: "Network failure" },
    ];
    render(<UploadQueue items={items} onRetry={onRetry} />);

    expect(screen.getByText("Network failure")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Retry bad.zip"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith("4");
  });

  it("fires onDismiss with the right id from a done item's dismiss button", () => {
    const onDismiss = vi.fn();
    render(<UploadQueue items={baseItems} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByLabelText("Dismiss video.mp4"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("2");
  });

  it("fires onDismiss from an error item's dismiss button (alongside its own retry button)", () => {
    const onDismiss = vi.fn();
    const onRetry = vi.fn();
    const items: UploadQueueItem[] = [
      { id: "5", name: "bad.zip", progress: 0, status: "error" },
    ];
    render(<UploadQueue items={items} onDismiss={onDismiss} onRetry={onRetry} />);

    expect(screen.getByLabelText("Retry bad.zip")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Dismiss bad.zip"));

    expect(onDismiss).toHaveBeenCalledWith("5");
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("does not show pause/resume/dismiss controls that don't apply to the item's status", () => {
    render(<UploadQueue items={baseItems} />);
    // photo.png is "uploading" — no dismiss button for it.
    expect(screen.queryByLabelText("Dismiss photo.png")).not.toBeInTheDocument();
    // video.mp4 is "done" — no pause/resume button for it.
    expect(screen.queryByLabelText("Pause video.mp4")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Resume video.mp4")).not.toBeInTheDocument();
  });

  it("collapses to a count pill when minimized (uncontrolled), and expands on click", () => {
    render(<UploadQueue items={baseItems} defaultMinimized />);

    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    const pill = screen.getByLabelText("Show upload queue: 1 uploading");
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent("1 uploading");

    fireEvent.click(pill);

    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Show upload queue/)).not.toBeInTheDocument();
  });

  it("uses an uploaded-count pill when nothing is currently uploading", () => {
    const items: UploadQueueItem[] = [
      { id: "1", name: "a.txt", progress: 100, status: "done" },
      { id: "2", name: "b.txt", progress: 100, status: "done" },
    ];
    render(<UploadQueue items={items} defaultMinimized />);
    expect(screen.getByText("2 of 2 uploaded")).toBeInTheDocument();
  });

  it("expanding then re-minimizing works uncontrolled via the header's minimize-toggle", () => {
    render(<UploadQueue items={baseItems} />);
    expect(screen.getByText("photo.png")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Minimize upload queue"));

    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Show upload queue: 1 uploading")).toBeInTheDocument();
  });

  it("fires onMinimizedChange but does not change visible state itself when minimized is controlled", () => {
    const onMinimizedChange = vi.fn();
    render(<UploadQueue items={baseItems} minimized={false} onMinimizedChange={onMinimizedChange} />);

    fireEvent.click(screen.getByLabelText("Minimize upload queue"));

    expect(onMinimizedChange).toHaveBeenCalledWith(true);
    // Still expanded — the parent never actually updated the controlled `minimized` prop.
    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });

  it("responds to a controlled minimized prop actually changing", () => {
    function Controlled() {
      const [minimized, setMinimized] = useState(false);
      return (
        <UploadQueue items={baseItems} minimized={minimized} onMinimizedChange={setMinimized} />
      );
    }
    render(<Controlled />);

    expect(screen.getByText("photo.png")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Minimize upload queue"));
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Show upload queue: 1 uploading"));
    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });
});
