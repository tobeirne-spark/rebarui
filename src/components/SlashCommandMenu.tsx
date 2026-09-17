import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Fragment, useEffect, useId, useMemo, useState } from "react";
import clsx from "clsx";
import { Empty } from "./Empty";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface SlashCommand {
  key: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Grouped heading this command renders under, e.g. "Basic blocks", "Media". Commands with no
   * `category` render in one implicit, heading-less group ahead of every named one. */
  category?: string;
  onSelect: () => void;
}

export interface SlashCommandMenuProps extends ComponentPropsWithoutRef<"div"> {
  commands: SlashCommand[];
  /** The text typed after "/" so far, tracked by the caller — this component doesn't detect the
   * trigger character or the caret position itself (see the file header comment below). */
  query: string;
  onClose: () => void;
  /** Force bionic reading on/off for command labels/descriptions and category headings,
   * overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

interface FlatEntry {
  command: SlashCommand;
  /** Stable position across every category, in render order — what keyboard nav and
   * `aria-activedescendant` actually index into, not the raw per-category order. Same technique
   * `CommandPalette.tsx`'s own `FlatEntry` uses for exactly the same "highlight must cross group
   * boundaries" requirement. */
  index: number;
}

/**
 * A Notion-style inline "/" command menu: typed mid-editing inside a `RichTextEditor`/plain
 * `<textarea>` context, not a global app-wide overlay (that's `CommandPalette`, Cmd+K-triggered)
 * and not an `@`-mention autocomplete (that's `Mentions`, a flat plain-text list). This component
 * is presentational/controlled — it renders whatever `commands`/`query` the caller currently has
 * and calls back into `command.onSelect()`/`onClose()`; detecting the "/" trigger character, the
 * caret position, and inserting the result into the editor are all the caller's job, the same
 * division of labor `Mentions.tsx`'s own `findActiveMention` established for its own trigger
 * character (just one layer further out here, since this component never sees the raw textarea at
 * all — the caller mounts/unmounts it and feeds it `query`).
 *
 * Filtering and cross-group keyboard nav reuse `CommandPalette.tsx`'s exact approach (case-
 * insensitive substring match on `label`; a flat index computed across every category so
 * ArrowUp/ArrowDown and `aria-activedescendant` both work the same regardless of which group the
 * highlight is currently in) — see `FlatEntry` above. The one real difference from both
 * `CommandPalette` (flat, no icons/descriptions) and `Mentions` (flat, plain text): this menu is
 * categorized (a heading per `category`) and icon+description rich per row, matching a Notion-
 * style "/" menu's actual content density.
 *
 * Keyboard handling is intentionally NOT wired via a `role="listbox"` element's own `onKeyDown` —
 * unlike `CommandPalette`'s `<input>` or `Mentions`' `<textarea>`, this component doesn't own the
 * text field the user is actually typing in (and typing keeps real DOM focus on the caller's
 * editor the whole time, per heuristic #1 — the user should never have to context-switch focus to
 * navigate this menu). Instead, a real `window` `keydown` listener is attached in the *capture*
 * phase for as long as this component is mounted, so ArrowUp/ArrowDown/Enter/Escape are
 * intercepted before the underlying `contentEditable`/`textarea` can apply its own default
 * behavior for those keys (moving the caret, inserting a newline) — the caller is expected to only
 * mount this component while its own "/" query is active, the same way `Mentions` only renders its
 * suggestion list while `activeMention` is non-null. This is a stated, deliberate simplification
 * (not silent): a page mounting more than one `SlashCommandMenu` at once, or mounting one outside
 * an actual active "/" context, would have its keydown listener fire regardless of which element
 * currently has focus.
 *
 * `aria-activedescendant` sits on the `role="listbox"` element itself, tracking the highlighted
 * row's real `id` on every navigation — the exact gap `ref/COMPONENT_BACKLOG.md` calls out on
 * `PickerWheel` (a `role="listbox"` with no `aria-activedescendant` and no per-option `id` at all).
 * Same caveat as that fix and as `Mentions`' own listbox: real DOM focus stays on the caller's
 * editor, not on this element, so a screen reader's own `aria-activedescendant` announcement
 * behavior depends on the assistive tech's handling of a non-focused listbox — an honest limitation
 * of not owning the underlying text field, not something this component can fully solve alone.
 */
export function SlashCommandMenu({
  commands,
  query,
  onClose,
  bionic,
  bionicOptions,
  className,
  "aria-label": ariaLabel = "Slash commands",
  ...rest
}: SlashCommandMenuProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const listId = useId();
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Case-insensitive substring match on `label` — the same reasonable-default approach
  // `Combobox`/`CommandPalette`/`Mentions` all already use, not a fuzzy/ranked match.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) => command.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Group by `category`, preserving first-appearance order of each group and original relative
  // order within a group; each command gets a stable flat index across group boundaries so
  // keyboard nav and aria-activedescendant both work regardless of which group is highlighted.
  const groups = useMemo(() => {
    const map = new Map<string | undefined, FlatEntry[]>();
    let index = 0;
    for (const command of filtered) {
      const key = command.category;
      const bucket = map.get(key) ?? [];
      bucket.push({ command, index: index++ });
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = useMemo(() => groups.flatMap(([, entries]) => entries), [groups]);

  // Re-highlight the first result whenever the filtered set changes (new query, or the caller
  // swapped in a new `commands` list).
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered]);

  const runCommand = (command: SlashCommand) => {
    command.onSelect();
    onClose();
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (flatItems.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((i) => (i + 1) % flatItems.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
      } else if (event.key === "Enter") {
        const entry = flatItems[highlightedIndex];
        if (entry) {
          event.preventDefault();
          runCommand(entry.command);
        }
      }
    }
    // Capture phase: win arbitration over the underlying editor's own keydown handling (or lack
    // thereof) for these keys — see the file header comment for why this menu can't just attach
    // onKeyDown to an element of its own the way CommandPalette/Mentions do.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatItems, highlightedIndex, onClose]);

  const clampedIndex = flatItems.length > 0 ? Math.min(highlightedIndex, flatItems.length - 1) : -1;
  const activeId = clampedIndex >= 0 ? `${listId}-${clampedIndex}` : undefined;

  return (
    <div className={clsx("rebar-slash-command-menu", className)} data-rebar-component="slash-command-menu" {...rest}>
      {flatItems.length === 0 ? (
        <Empty description="No matching commands" icon="vector" />
      ) : (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={activeId}
          className="rebar-slash-command-menu-list"
          data-rebar-part="list"
        >
          {groups.map(([category, entries]) => (
            <Fragment key={category ?? "__uncategorized"}>
              {category ? (
                <li role="presentation">
                  <div
                    className="rebar-slash-command-menu-category-heading"
                    data-rebar-part="category-heading"
                  >
                    {renderBionicChildren(category, bionicEnabled, bionicOptions)}
                  </div>
                </li>
              ) : null}
              {entries.map(({ command, index }) => (
                <li key={command.key} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === clampedIndex}
                    className="rebar-slash-command-menu-command"
                    data-rebar-part="command"
                    data-rebar-active={index === clampedIndex || undefined}
                    // onMouseDown (not onClick), preventDefault: fires before the underlying
                    // contentEditable/textarea would lose focus on mousedown, so a click here
                    // never steals focus away from the caller's editor mid-insertion — same trick
                    // Mentions/Combobox's own option lists use for the same reason.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      runCommand(command);
                    }}
                  >
                    {command.icon ? (
                      <span
                        className="rebar-slash-command-menu-command-icon"
                        data-rebar-part="command-icon"
                        aria-hidden="true"
                      >
                        {command.icon}
                      </span>
                    ) : null}
                    <span className="rebar-slash-command-menu-command-text" data-rebar-part="command-text">
                      <span className="rebar-slash-command-menu-command-label">
                        {renderBionicChildren(command.label, bionicEnabled, bionicOptions)}
                      </span>
                      {command.description ? (
                        <span className="rebar-slash-command-menu-command-description">
                          {renderBionicChildren(command.description, bionicEnabled, bionicOptions)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
