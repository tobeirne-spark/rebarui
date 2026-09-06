import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, KeyboardEvent } from "react";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Empty } from "./Empty";

export interface CommandPaletteCommand {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onSelect" | "children"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  commands: CommandPaletteCommand[];
  placeholder?: string;
}

interface FlatEntry {
  command: CommandPaletteCommand;
  /** Stable position across every group, in render order — what keyboard nav and
   * aria-activedescendant actually index into (not the raw, ungrouped `filtered` order). */
  index: number;
}

/**
 * A Cmd+K-style command palette: a searchable, keyboard-navigable list of commands in a
 * forced-open modal shell. Deliberately NOT built on top of the real `Dialog` component — `Dialog`
 * requires a `title` (always rendered as a visible heading + close button in its header), which is
 * exactly the chrome a command palette doesn't want; see the CommandPalette.tsx file header comment
 * in the PR/report for the fuller rationale. Built directly on `@radix-ui/react-dialog` instead,
 * matching `Dialog.tsx`'s own controlled/uncontrolled pattern, CSS class naming, and reliance on
 * Radix for focus-trapping + Escape-to-close (never reimplemented here).
 *
 * Filtering reuses `Combobox`'s exact substring/case-insensitive matching approach (trim, lowercase,
 * `includes`) for consistency — see ref/HEURISTICS.md #4 (consistency and standards).
 *
 * A global Cmd+K keyboard shortcut is explicitly OUT OF SCOPE here: attaching a `document`-level
 * keydown listener on mount is an app-level concern (which key combo, which pages it's active on),
 * not something a `packages/core` component should silently own. Consumers wire that up themselves
 * and drive this component via the same `open`/`onOpenChange` controlled pattern every other
 * rebar-ui overlay uses.
 */
export function CommandPalette({
  open,
  defaultOpen,
  onOpenChange,
  commands,
  placeholder = "Type a command...",
  className,
  "aria-label": ariaLabel = "Command palette",
  ...rest
}: CommandPaletteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Dialog.tsx's controlled/uncontrolled pattern, verbatim.
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Start fresh every time the palette opens — no stale query/highlight from the last time it
  // was used.
  useEffect(() => {
    if (currentOpen) {
      setQuery("");
      setHighlightedIndex(0);
    }
  }, [currentOpen]);

  // Same substring/case-insensitive matching approach as Combobox.tsx's `filtered`.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Re-highlight the first result whenever the filtered set changes (new query, or reopened).
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered]);

  // Group by `group`, preserving first-appearance order of each group and original relative order
  // within a group; each command gets a stable flat index across group boundaries.
  const groups = useMemo(() => {
    const map = new Map<string | undefined, FlatEntry[]>();
    let index = 0;
    for (const command of filtered) {
      const key = command.group;
      const bucket = map.get(key) ?? [];
      bucket.push({ command, index: index++ });
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = useMemo(() => groups.flatMap(([, entries]) => entries), [groups]);

  const runCommand = (command: CommandPaletteCommand) => {
    command.onSelect();
    handleOpenChange(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((i) => (i + 1) % flatItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = flatItems[highlightedIndex];
      if (entry) runCommand(entry.command);
    }
    // Escape is intentionally left alone — it bubbles to Radix's own dismiss handling, the same
    // "don't reimplement what Radix gives for free" rule Dialog.tsx follows.
  };

  return (
    <RadixDialog.Root open={currentOpen} onOpenChange={handleOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="rebar-command-palette-overlay" data-rebar-part="overlay" />
        <RadixDialog.Content
          className={clsx("rebar-command-palette-content", className)}
          data-rebar-component="command-palette"
          aria-label={ariaLabel}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          {...rest}
        >
          <input
            ref={inputRef}
            type="text"
            className="rebar-command-palette-input"
            data-rebar-part="search-input"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={true}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={flatItems.length > 0 ? `${listId}-${highlightedIndex}` : undefined}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {flatItems.length === 0 ? (
            <Empty description="No matching commands" icon="vector" />
          ) : (
            <ul id={listId} role="listbox" className="rebar-command-palette-list" data-rebar-part="list">
              {groups.map(([group, entries]) => (
                <Fragment key={group ?? "__ungrouped"}>
                  {group ? (
                    <li role="presentation">
                      <div className="rebar-command-palette-group-label" data-rebar-part="group-label">
                        {group}
                      </div>
                    </li>
                  ) : null}
                  {entries.map(({ command, index }) => (
                    <li key={command.id} role="presentation">
                      <button
                        type="button"
                        id={`${listId}-${index}`}
                        role="option"
                        tabIndex={-1}
                        aria-selected={index === highlightedIndex}
                        className="rebar-command-palette-item"
                        data-rebar-part="item"
                        data-rebar-active={index === highlightedIndex || undefined}
                        onClick={() => runCommand(command)}
                      >
                        <span className="rebar-command-palette-item-label">{command.label}</span>
                        {command.shortcut ? (
                          <span className="rebar-command-palette-item-shortcut" data-rebar-part="shortcut">
                            {command.shortcut}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
