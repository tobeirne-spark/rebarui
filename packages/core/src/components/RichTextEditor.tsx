import { useEffect, useRef } from "react";
import type { ChangeEvent, ClipboardEvent, ComponentPropsWithoutRef, DragEvent, MouseEvent } from "react";
import type { ComponentType } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { BoldOutlined, ItalicOutlined, LinkOutlined, OrderedListOutlined, PictureOutlined, UnderlineOutlined, UnorderedListOutlined } from "./icons-antd";
import type { IconProps } from "./iconFactory";

export interface RichTextEditorProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value" | "defaultValue" | "onChange"> {
  /** An HTML string — this component edits and returns real HTML, the same shape a
   * `dangerouslySetInnerHTML` consumer or a server-rendered rich-text field already expects. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (html: string) => void;
  placeholder?: string;
  /** Minimum height of the editable area, in px. Default 160. */
  minHeight?: number;
  /** Caps how large a pasted/dropped/uploaded image can be, in bytes, before it's silently
   * rejected (the image is embedded as a base64 data URL directly in `value`'s HTML, so an
   * unbounded image would bloat whatever the caller persists that HTML to). Default 4MB. */
  maxImageBytes?: number;
}

const COMMANDS: { command: string; label: string; Icon: ComponentType<IconProps> }[] = [
  { command: "bold", label: "Bold", Icon: BoldOutlined },
  { command: "italic", label: "Italic", Icon: ItalicOutlined },
  { command: "underline", label: "Underline", Icon: UnderlineOutlined },
  { command: "insertUnorderedList", label: "Bulleted list", Icon: UnorderedListOutlined },
  { command: "insertOrderedList", label: "Numbered list", Icon: OrderedListOutlined },
];

/**
 * A minimal, honest WYSIWYG editor — a real `contentEditable` region with a small formatting
 * toolbar (bold/italic/underline/lists/link), not a ProseMirror/Tiptap-grade rich text engine.
 * That's a deliberate scope call, not an oversight: this project's own low-fidelity philosophy
 * (ref/HEURISTICS.md, and `/docs/design-philosophy`) is to ship the real, correct *shape* of an
 * interaction rather than compete on polish with a dedicated editor library, the same reasoning
 * that kept `CodeBlock` free of syntax highlighting. Formatting commands use the browser's
 * `document.execCommand` — formally deprecated by the spec, but still universally supported for
 * exactly these basic commands (bold/italic/underline/lists) in every current browser; reaching
 * for the modern replacement (a full `ContentEditable`/Selection-API reimplementation of each
 * command) would be substantially more code for no real behavior difference at this feature
 * level, so this is a pragmatic, working choice, not a hidden shortcut.
 *
 * `value` is real HTML (matching what a server-rendered rich-text field or a
 * `dangerouslySetInnerHTML` consumer already expects) — the controlled sync only overwrites the
 * live DOM when `value` genuinely differs from the editor's own current `innerHTML`, so typing
 * never fights the cursor position mid-edit (the same "don't clobber input mid-interaction"
 * discipline `Card`'s own `editable` title fix already established).
 *
 * **No bionic reading here — a real, checked non-fit, not an oversight (ref/HEURISTICS.md 1.1's
 * audit).** Bionic reading works by wrapping the *first fraction of each word* in its own element;
 * applying that to `value` itself would inject presentation markup into the real saved document —
 * the exact content a caller's `dangerouslySetInnerHTML` consumer or server-side field expects back
 * verbatim, not mixed with `<span class="rebar-bionic-fixation">` wrappers around fragments of
 * every word. That's a fundamentally different problem than every other bionic-wired component:
 * everywhere else, the *rendered* text is a display-only derivation of a separate `value`/`label`
 * prop the split never touches; here, the editable region's rendered DOM *is* the value. The
 * placeholder (shown via `.rebar-rich-text-editor-content:empty::before { content:
 * attr(data-placeholder) }`) has the same "same blocker class as diagrams" problem noted elsewhere
 * in this codebase for a different reason: CSS generated content can't carry per-word `<span>`
 * markup at all without a JS mechanism to inject real DOM nodes — and doing that here would mean
 * injecting content into the otherwise-`:empty` region the CSS selector itself depends on.
 */
const DEFAULT_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function RichTextEditor({
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Start typing...",
  minHeight = 160,
  maxImageBytes = DEFAULT_MAX_IMAGE_BYTES,
  className,
  ...props
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!isControlled) {
      el.innerHTML = defaultValue;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
    // Only re-sync when the controlled value itself changes — reading defaultValue/isControlled
    // here would re-run (and clobber the cursor) on every keystroke, since they don't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    onValueChange?.(el.innerHTML);
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt("Link URL");
    if (!url) return;
    const label = window.prompt("Link text", url);
    if (!label) return;
    editorRef.current?.focus();
    // `createLink` only wraps whatever text/selection is already there (nothing, if the caret is
    // just sitting in empty space) — inserting a real `<a>` with its own chosen label works
    // regardless of the current selection. `target="_blank"` alone doesn't make it click-to-open
    // *inside* a contentEditable region though (browsers suppress link navigation there so a
    // click can place the caret instead) — the content div's own onClick handles that half, see
    // below.
    const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    document.execCommand("insertHTML", false, `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`);
    emitChange();
  };

  // Images embed as base64 data URLs directly inside the saved HTML -- no upload endpoint
  // required for this to work out of the box, at the cost of bloating whatever the caller
  // persists `value` to by roughly 4/3 the image's own size. `maxImageBytes` exists specifically
  // to keep that bloat bounded; a caller storing this HTML in a database row is the intended
  // audience for that cap, not one serving images from disk/CDN.
  const insertImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > maxImageBytes) {
      window.alert(`That image is too large to insert (max ${Math.round(maxImageBytes / (1024 * 1024))}MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, `<img src="${dataUrl}" alt="${file.name.replace(/"/g, "&quot;")}" />`);
      emitChange();
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          insertImageFile(file);
        }
        return;
      }
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const file = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    insertImageFile(file);
  };

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) insertImageFile(file);
    event.target.value = "";
  };

  // A plain click on a link inside a contentEditable region normally does nothing but move the
  // caret (by design, so you can edit text right up against a link) — this is what actually makes
  // a link open, the one real behavior difference from a link anywhere else on the page.
  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    event.preventDefault();
    window.open(link.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={clsx("rebar-rich-text-editor", className)} data-rebar-component="rich-text-editor" {...props}>
      <div className="rebar-rich-text-editor-toolbar" data-rebar-part="toolbar" role="toolbar" aria-label="Formatting">
        {COMMANDS.map(({ command, label, Icon }) => (
          <Button
            key={command}
            type="button"
            variant="secondary"
            size="sm"
            aria-label={label}
            className="rebar-rich-text-editor-toolbar-button"
            // A native <button> steals focus (and with it, the browser's current selection Range)
            // on mousedown, before the click handler ever runs — `insertUnorderedList`/
            // `insertOrderedList` need that Range to still be inside the editable region to have
            // anything to wrap in a list (unlike bold/italic/underline, which still toggle fine
            // from a bare collapsed caret after refocusing), so they silently no-op without this.
            // Blocking the default mousedown behavior is the standard fix for every contentEditable
            // toolbar for exactly this reason.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(command)}
          >
            <Icon size={16} />
          </Button>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Insert link"
          className="rebar-rich-text-editor-toolbar-button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLink}
        >
          <LinkOutlined size={16} />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Insert image"
          className="rebar-rich-text-editor-toolbar-button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <PictureOutlined size={16} />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-hidden="true"
          style={{ display: "none" }}
          onChange={handleImageInputChange}
        />
      </div>
      <div
        ref={editorRef}
        className="rebar-rich-text-editor-content"
        data-rebar-part="content"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={emitChange}
        onBlur={emitChange}
        onClick={handleContentClick}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        suppressContentEditableWarning
      />
    </div>
  );
}
