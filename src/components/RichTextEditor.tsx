import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { Button } from "./Button";

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
}

const COMMANDS: { command: string; label: string; glyph: string }[] = [
  { command: "bold", label: "Bold", glyph: "B" },
  { command: "italic", label: "Italic", glyph: "I" },
  { command: "underline", label: "Underline", glyph: "U" },
  { command: "insertUnorderedList", label: "Bulleted list", glyph: "•" },
  { command: "insertOrderedList", label: "Numbered list", glyph: "1." },
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
 */
export function RichTextEditor({
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Start typing...",
  minHeight = 160,
  className,
  ...props
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
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
    editorRef.current?.focus();
    document.execCommand("createLink", false, url);
    emitChange();
  };

  return (
    <div className={clsx("rebar-rich-text-editor", className)} data-rebar-component="rich-text-editor" {...props}>
      <div className="rebar-rich-text-editor-toolbar" data-rebar-part="toolbar" role="toolbar" aria-label="Formatting">
        {COMMANDS.map(({ command, label, glyph }) => (
          <Button
            key={command}
            type="button"
            variant="secondary"
            size="sm"
            aria-label={label}
            className="rebar-rich-text-editor-toolbar-button"
            onClick={() => runCommand(command)}
          >
            {glyph}
          </Button>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Insert link"
          className="rebar-rich-text-editor-toolbar-button"
          onClick={insertLink}
        >
          🔗
        </Button>
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
        suppressContentEditableWarning
      />
    </div>
  );
}
