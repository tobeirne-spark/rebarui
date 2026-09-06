import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileUpload } from "../components/FileUpload";
import type { UploadFileState } from "../components/FileUpload";

function makeFile(name: string, size: number, type = "text/plain"): File {
  const file = new File(["x".repeat(Math.min(size, 1))], name, { type });
  // jsdom computes `size` from the Blob parts given; override it directly so tests can exercise
  // maxSizeBytes without actually allocating megabytes of string content.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

// jsdom's own DragEvent doesn't support a `dataTransfer` property (a known jsdom limitation), so
// drop/dragover-with-files is simulated the same way this codebase's other drag-and-drop tests
// work around it: a plain Event with `dataTransfer` attached via defineProperty.
function fileDragEvent(type: string, files: File[]) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: { files } });
  return event;
}

describe("FileUpload", () => {
  it("renders a dropzone, a picker button, and a hidden native file input", () => {
    const { container } = render(<FileUpload />);
    expect(container.querySelector('[data-rebar-component="file-upload"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="dropzone"]')).toBeInTheDocument();
    expect(container.querySelector('[data-rebar-part="picker"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="file"][data-rebar-part="input"]')).toBeInTheDocument();
  });

  it("fires onFilesSelected when picking a valid file via the hidden input", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("report.pdf", 1024);

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0]![0]).toEqual([file]);
  });

  it("clicking the picker button opens the native file picker (triggers the hidden input)", () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getByText("Choose file"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("fires onFilesSelected when dropping a valid file onto the dropzone", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload onFilesSelected={onFilesSelected} />);
    const dropzone = container.querySelector('[data-rebar-part="dropzone"]') as HTMLElement;
    const file = makeFile("photo.png", 2048, "image/png");

    fireEvent(dropzone, fileDragEvent("drop", [file]));

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0]![0]).toEqual([file]);
  });

  it("rejects a file over maxSizeBytes with a visible client-side error and excludes it from onFilesSelected", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload maxSizeBytes={1000} onFilesSelected={onFilesSelected} />);
    const dropzone = container.querySelector('[data-rebar-part="dropzone"]') as HTMLElement;
    const tooBig = makeFile("huge.zip", 5000);

    fireEvent(dropzone, fileDragEvent("drop", [tooBig]));

    expect(onFilesSelected).not.toHaveBeenCalled();
    const errorRow = container.querySelector('[data-rebar-part="file-row"][data-rebar-status="error"]');
    expect(errorRow).toBeInTheDocument();
    expect(errorRow).toHaveTextContent("huge.zip");
    expect(container.querySelector('[data-rebar-part="file-error"]')).toBeInTheDocument();
  });

  it("only includes valid files in onFilesSelected when a mixed batch is dropped", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(
      <FileUpload multiple maxSizeBytes={1000} onFilesSelected={onFilesSelected} />,
    );
    const dropzone = container.querySelector('[data-rebar-part="dropzone"]') as HTMLElement;
    const ok = makeFile("small.txt", 100);
    const tooBig = makeFile("huge.zip", 5000);

    fireEvent(dropzone, fileDragEvent("drop", [ok, tooBig]));

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected.mock.calls[0]![0]).toEqual([ok]);
  });

  it("shows the drag-active state (with the active-border beam) on dragenter and clears it on dragleave", () => {
    const { container } = render(<FileUpload />);
    const dropzone = container.querySelector('[data-rebar-part="dropzone"]') as HTMLElement;

    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass("rebar-file-upload-dropzone-active");
    expect(dropzone).toHaveClass("rebar-active-border");

    fireEvent.dragLeave(dropzone, { relatedTarget: document.body });
    expect(dropzone).not.toHaveClass("rebar-file-upload-dropzone-active");
    expect(dropzone).not.toHaveClass("rebar-active-border");
  });

  it("clears the drag-active state on drop", () => {
    const { container } = render(<FileUpload />);
    const dropzone = container.querySelector('[data-rebar-part="dropzone"]') as HTMLElement;

    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass("rebar-file-upload-dropzone-active");

    fireEvent(dropzone, fileDragEvent("drop", []));
    expect(dropzone).not.toHaveClass("rebar-file-upload-dropzone-active");
  });

  it("shows a real Progress bar for a file row with status uploading", () => {
    const files: UploadFileState[] = [
      { id: "1", name: "video.mp4", size: 12345, status: "uploading", progress: 45 },
    ];
    const { container } = render(<FileUpload files={files} />);

    const progress = container.querySelector('[data-rebar-component="progress"]');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute("aria-valuenow", "45");
  });

  it("fires onRemove with the right file when a row's remove button is clicked", () => {
    const onRemove = vi.fn();
    const files: UploadFileState[] = [
      { id: "1", name: "a.txt", size: 10, status: "done" },
      { id: "2", name: "b.txt", size: 20, status: "done" },
    ];
    render(<FileUpload files={files} onRemove={onRemove} />);

    fireEvent.click(screen.getByLabelText("Remove b.txt"));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove.mock.calls[0]![0]).toEqual(files[1]);
  });

  it("removes a client-side-rejected row from view when its remove button is clicked", () => {
    const { container } = render(<FileUpload maxSizeBytes={100} />);
    const dropzone = container.querySelector('[data-rebar-part="dropzone"]') as HTMLElement;
    const tooBig = makeFile("huge.zip", 5000);
    fireEvent(dropzone, fileDragEvent("drop", [tooBig]));

    expect(container.querySelector('[data-rebar-part="file-row"]')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remove huge.zip"));
    expect(container.querySelector('[data-rebar-part="file-row"]')).not.toBeInTheDocument();
  });
});
