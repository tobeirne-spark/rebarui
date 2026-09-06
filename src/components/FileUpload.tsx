import { forwardRef, useRef, useState } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, DragEvent } from "react";
import clsx from "clsx";
import { Progress } from "./Progress";

export interface UploadFileState {
  id: string;
  name: string;
  size: number;
  progress?: number;
  status?: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

export interface FileUploadProps extends ComponentPropsWithoutRef<"div"> {
  /** Native `<input type="file">` `accept` attribute (e.g. `"image/*"`, `".pdf,.docx"`). */
  accept?: string;
  /** Allow picking/dropping more than one file at once. */
  multiple?: boolean;
  /**
   * Files over this size (in bytes) are rejected client-side with a visible error the moment
   * they're picked or dropped — never silently dropped, and never included in `onFilesSelected`.
   */
  maxSizeBytes?: number;
  /**
   * Fired with the valid (post-`maxSizeBytes` validation) files the user just picked or dropped.
   * This component performs no network upload itself — it has no server to talk to. The caller
   * owns the real upload call and reports progress back in via `files`.
   */
  onFilesSelected?: (files: File[]) => void;
  /**
   * Controlled: the list of files currently shown, each with its own progress/status. This is how
   * a caller reports real upload progress back into the component after doing its own upload.
   * Deliberately no internal/uncontrolled fallback here — unlike a value/selection prop, there's
   * no sensible default state for upload progress the component could own itself, since it never
   * performs the upload; the caller is the only possible source of truth for it. Rows this
   * component rejects client-side (over `maxSizeBytes`) are tracked internally instead, since the
   * caller never learns about them (they're never passed to `onFilesSelected`).
   */
  files?: UploadFileState[];
  /**
   * Fired when the user removes a row — a caller-supplied file (before or after upload) or one of
   * this component's own client-side-rejected rows.
   */
  onRemove?: (file: UploadFileState) => void;
}

/** `1234567` -> `"1.2 MB"`. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

let rejectedIdCounter = 0;
function nextRejectedId(): string {
  rejectedIdCounter += 1;
  return `file-upload-rejected-${rejectedIdCounter}`;
}

/** Trims down to the first file when the component isn't in `multiple` mode — native
 * `<input type="file">` already enforces this via its own `multiple` attribute for the OS picker
 * dialog, but a drag-and-drop can still deliver more than one file regardless of that attribute. */
function limitToMultiple(list: File[], multiple: boolean | undefined): File[] {
  return multiple ? list : list.slice(0, 1);
}

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  { accept, multiple, maxSizeBytes, onFilesSelected, files, onRemove, className, ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<UploadFileState[]>([]);

  const processFiles = (incoming: File[]) => {
    const limited = limitToMultiple(incoming, multiple);
    const valid: File[] = [];
    const rejected: UploadFileState[] = [];

    for (const file of limited) {
      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        rejected.push({
          id: nextRejectedId(),
          name: file.name,
          size: file.size,
          status: "error",
          errorMessage: `"${file.name}" is ${formatBytes(file.size)} — over the ${formatBytes(maxSizeBytes)} limit`,
        });
      } else {
        valid.push(file);
      }
    }

    if (rejected.length > 0) {
      setRejectedFiles((prev) => [...prev, ...rejected]);
    }
    if (valid.length > 0) {
      onFilesSelected?.(valid);
    }
  };

  const handlePickerClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files ? Array.from(event.target.files) : [];
    processFiles(picked);
    // Reset so picking the exact same file again still fires a change event.
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // dragenter/dragleave fire for every child crossed, not just the dropzone's own boundary —
  // only clear once the pointer has actually left this element's subtree (checked via
  // relatedTarget), so hovering over the hint text/button/input inside doesn't flicker the
  // expansion. Same fix as Kanban's own drop-target dragleave handler.
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    processFiles(dropped);
  };

  const handleRemove = (file: UploadFileState) => {
    setRejectedFiles((prev) => prev.filter((f) => f.id !== file.id));
    onRemove?.(file);
  };

  const rows = [...(files ?? []), ...rejectedFiles];

  return (
    <div
      ref={ref}
      className={clsx("rebar-file-upload", className)}
      data-rebar-component="file-upload"
      {...props}
    >
      <div
        className={clsx(
          "rebar-file-upload-dropzone",
          dragActive && "rebar-file-upload-dropzone-active rebar-active-border",
        )}
        data-rebar-part="dropzone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="rebar-file-upload-hint">
          Drag {multiple ? "files" : "a file"} here, or
        </p>
        <button
          type="button"
          className="rebar-file-upload-picker"
          data-rebar-part="picker"
          onClick={handlePickerClick}
        >
          Choose {multiple ? "files" : "file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="rebar-file-upload-input"
          data-rebar-part="input"
          accept={accept}
          multiple={multiple}
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleInputChange}
        />
      </div>
      {rows.length > 0 ? (
        <ul className="rebar-file-upload-list" data-rebar-part="list">
          {rows.map((file) => (
            <li
              key={file.id}
              className="rebar-file-upload-row"
              data-rebar-part="file-row"
              data-rebar-status={file.status ?? "pending"}
            >
              <div className="rebar-file-upload-row-info">
                <span className="rebar-file-upload-row-name" data-rebar-part="file-name">
                  {file.name}
                </span>
                <span className="rebar-file-upload-row-size" data-rebar-part="file-size">
                  {formatBytes(file.size)}
                </span>
              </div>
              <div className="rebar-file-upload-row-status" data-rebar-part="file-status">
                {file.status === "uploading" ? (
                  <Progress
                    value={file.progress ?? 0}
                    aria-label={`Uploading ${file.name}`}
                    className="rebar-file-upload-progress"
                  />
                ) : file.status === "error" ? (
                  <span className="rebar-file-upload-row-error" data-rebar-part="file-error">
                    {file.errorMessage ?? "Upload failed"}
                  </span>
                ) : file.status === "done" ? (
                  <span
                    className="rebar-file-upload-row-success"
                    data-rebar-part="file-success"
                    aria-label="Upload complete"
                  >
                    ✓
                  </span>
                ) : (
                  <span className="rebar-file-upload-row-pending" data-rebar-part="file-pending">
                    Pending
                  </span>
                )}
              </div>
              <button
                type="button"
                className="rebar-file-upload-remove"
                data-rebar-part="remove"
                aria-label={`Remove ${file.name}`}
                onClick={() => handleRemove(file)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
