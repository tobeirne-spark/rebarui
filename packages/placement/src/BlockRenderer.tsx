import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AiChatInput,
  Avatar,
  Box,
  Button,
  Card,
  Carousel,
  ChatThread,
  Checkbox,
  CodeBlock,
  Dialog,
  Editable,
  Empty,
  ErrorBlock,
  Footer,
  Heading,
  Iframe,
  Input,
  Kanban,
  LineChart,
  NavBar,
  NavIndex,
  Popconfirm,
  Popover,
  ScatterChart,
  SectionNav,
  Select,
  SidePanel,
  Spin,
  Stack,
  StackedBarChart,
  Tab,
  TabList,
  TabPanel,
  Table,
  Tabs,
  Tag,
  Text,
  ThemeToggle,
  TodoItem,
  Wizard,
} from "rebar-ui";
import type { AiChatInputIntent, ChatMessage, TableColumn, WizardValue } from "rebar-ui";
import type {
  Action,
  Construct,
  FormField,
  GoalTrackerFocusAreaData,
  ProseNode,
  TableFilter,
} from "./schema";
import type {
  AiChatSendHandler,
  AiChatSource,
  FormSubmitHandler,
  GoalTrackerChangeHandler,
  GoalTrackerSource,
  KanbanBoardSource,
  KanbanChangeHandler,
  LineChartSource,
  ScatterChartSource,
  StackedBarChartSource,
  TableAddRowHandler,
  TableRowActionHandler,
  TableSource,
  WizardSubmitHandler,
} from "./live";
import { ICONS } from "./icons";

// Parses the tiny inline markup `doc-section` prose supports: `` `code` ``, `[label](href)`, and
// `*emphasis*`. Deliberately not a markdown library — three patterns, checked in document order,
// everything else passes through as plain text. Good enough for the prose this project's own docs
// actually need; anything more ambitious belongs in a real markdown renderer, not this schema.
const INLINE_MARKUP = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g;

/** `Avatar`'s `fallback` prop is meant to be short initials, not a full name — Radix always
 * renders it as real visible text (until/unless an image loads), so passing the full name here
 * would duplicate it right next to the name the block already displays as its own label. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "");
}

/** A `doc-section`'s anchor id, derived from its heading text so a `page-index` block can link to
 * it without the document author separately inventing and wiring up an id by hand. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const propsTableCellStyle: CSSProperties = {
  padding: "var(--rebar-space-sm, 8px)",
  borderBottom: "1px solid var(--rebar-color-border, #e0e0e0)",
  verticalAlign: "top",
};

function renderInline(text: string, renderLink: NonNullable<BlockRendererProps["renderLink"]>) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  INLINE_MARKUP.lastIndex = 0;
  while ((match = INLINE_MARKUP.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<code key={key++}>{match[1]}</code>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key++}>{match[4]}</em>);
    } else {
      nodes.push(<span key={key++}>{renderLink({ href: match[3]!, children: match[2] })}</span>);
    }
    lastIndex = INLINE_MARKUP.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderProseNode(
  node: ProseNode,
  index: number,
  renderLink: NonNullable<BlockRendererProps["renderLink"]>,
) {
  switch (node.kind) {
    case "text":
      return (
        <Text key={index} size="sm" color="secondary">
          {renderInline(node.text, renderLink)}
        </Text>
      );
    case "code":
      return <CodeBlock key={index} code={node.code} />;
    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <Box key={index} as={ListTag} style={{ paddingLeft: "var(--rebar-space-lg)" }}>
          {node.items.map((item, itemIndex) => (
            <Box as="li" key={itemIndex} style={{ marginBottom: "var(--rebar-space-xs)" }}>
              <Text as="span" size="sm" color="secondary">
                {renderInline(item, renderLink)}
              </Text>
            </Box>
          ))}
        </Box>
      );
    }
    default:
      return null;
  }
}

/** Live data sources, keyed by whatever string an individual block's own `source` field
 * references — e.g. `{ chatMessages: messages }` resolves an `ai-chat` block whose `source` is
 * `"chatMessages"`. Type your own object literal against `./live`'s exported per-block types
 * (`AiChatSource`, `TableSource`, ...) with `satisfies` at the call site for real compile-time
 * checking, even though this map itself stays a plain string-keyed `Record`. */
export type BlockRendererData = Record<string, unknown>;

/** Live event handlers, keyed the same way as `BlockRendererData` — e.g.
 * `{ sendChatMessage: handleSend }` resolves an `ai-chat` block whose `onSend` is
 * `"sendChatMessage"`. */
export type BlockRendererHandlers = Record<string, (...args: never[]) => void>;

export interface BlockRendererProps {
  blocks: Construct[];
  /**
   * How an `Action`/pillar-grid `href` becomes a link. Defaults to a plain `<a>` — pass your
   * framework's link component (e.g. Next.js `Link`) to get client-side navigation instead of a
   * full page load. Kept out of this package's own dependencies on purpose: the placement layer
   * shouldn't need to know which framework it's running inside.
   */
  renderLink?: (props: { href: string; children: ReactNode; className?: string; onClick?: () => void }) => ReactNode;
  /** Live data sources for Opinion-tier blocks (see schema.ts's `source` fields and
   * `./opinions`) — supplied by the real, hand-authored app code that owns the live state. Omit
   * entirely for a purely static document; every block renders its own literal data exactly as
   * before. The same "a real value supplied outside the serializable block data, referenced from
   * inside it only by name" pattern this package's `renderLink` already established. */
  data?: BlockRendererData;
  /** Live event handlers for Opinion-tier blocks (see schema.ts's `onX` fields) — resolved the
   * same way as `data`. */
  handlers?: BlockRendererHandlers;
}

const defaultRenderLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="rebar-link">
    {children}
  </a>
);

/** Resolves a block's `source` key against `data`, falling back to `fallback` (the block's own
 * literal field) when `key` is unset or not present in `data` — the shared mechanism every
 * Opinion-tier `*BlockView` uses to decide "am I live or static," per `ref/PLACEMENT_LIVE_DATA.md`. */
function resolveSource<T>(data: BlockRendererData, key: string | undefined, fallback: T): T {
  if (key === undefined) return fallback;
  return (data[key] as T | undefined) ?? fallback;
}

/** Resolves a block's `onX` key against `handlers` — `undefined` when unset, so callers can tell
 * "no live handler wired" apart from "a live handler that happens to no-op." */
function resolveHandler<T extends (...args: never[]) => void>(
  handlers: BlockRendererHandlers,
  key: string | undefined,
): T | undefined {
  return key === undefined ? undefined : (handlers[key] as T | undefined);
}

function renderActionContent(action: Action | undefined) {
  if (!action) return null;
  const Icon = action.icon ? ICONS[action.icon] : null;
  return (
    <Stack direction="row" align="center" gap="xs">
      {Icon ? <Icon /> : null}
      {action.label ? <span>{action.label}</span> : null}
    </Stack>
  );
}

function renderAction(
  action: Action | undefined,
  renderLink: NonNullable<BlockRendererProps["renderLink"]>,
) {
  if (!action) return null;
  const fallbackLabel = action.icon
    ? action.icon.charAt(0).toUpperCase() + action.icon.slice(1)
    : "Action";
  const content = (
    <Button variant="secondary" size="sm" aria-label={action.label ?? fallbackLabel}>
      {renderActionContent(action)}
    </Button>
  );
  return action.href ? renderLink({ href: action.href, children: content }) : content;
}

// A stable, schema-shaped address for one block or one item inside it — e.g.
// `blocks[2].items[3]` or `blocks[1].tabs[0].blocks[1]`. Mirrors the real property names in
// schema.ts (items/rows/fields/tabs/blocks) on purpose: this is meant to be pasted directly into
// a follow-up prompt ("change blocks[2].items[3]'s badge to Draft"), not just a debugging label.
// Exposed on the DOM as `data-rebar-block-path` so the DevTools ComponentInspector can surface it
// on hover — precise, click-driven feedback into the DSL instead of describing a screenshot.
function itemPath(blockPath: string, arrayName: string, itemIndex: number) {
  return `${blockPath}.${arrayName}[${itemIndex}]`;
}

function renderFormField(
  field: FormField,
  index: number,
  blockPath: string,
  value: WizardValue | undefined,
  onFieldChange: (label: string, value: WizardValue) => void,
) {
  const fieldPath = itemPath(blockPath, "fields", index);
  switch (field.kind) {
    case "text":
    case "email":
    case "date":
      return (
        <Stack key={index} gap="xs" data-rebar-block-path={fieldPath} data-rebar-block-item-label={field.label}>
          <Text as="label" size="sm">
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <Input
            type={field.kind}
            aria-label={field.label}
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onFieldChange(field.label, e.target.value)}
          />
        </Stack>
      );
    case "textarea":
      return (
        <Stack key={index} gap="xs" data-rebar-block-path={fieldPath} data-rebar-block-item-label={field.label}>
          <Text as="label" size="sm">
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <textarea
            className="rebar-input"
            aria-label={field.label}
            placeholder={field.placeholder}
            rows={3}
            value={(value as string) ?? ""}
            onChange={(e) => onFieldChange(field.label, e.target.value)}
          />
        </Stack>
      );
    case "select":
      return (
        <Stack key={index} gap="xs" data-rebar-block-path={fieldPath} data-rebar-block-item-label={field.label}>
          <Text as="label" size="sm">
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <Select
            aria-label={field.label}
            options={field.options.map((o) => ({ value: o, label: o }))}
            placeholder={field.options[0]}
            value={value as string}
            onValueChange={(v) => onFieldChange(field.label, v)}
          />
        </Stack>
      );
    case "checkbox":
      return (
        <Checkbox
          key={index}
          checked={(value as boolean) ?? field.checked ?? false}
          onCheckedChange={(checked) => onFieldChange(field.label, checked === true)}
          data-rebar-block-path={fieldPath}
          data-rebar-block-item-label={field.label}
        >
          {field.label}
          {field.required ? " *" : ""}
        </Checkbox>
      );
    default:
      return null;
  }
}

function FormBlockView({
  block,
  path,
  handlers,
}: {
  block: Extract<Construct, { type: "form" }>;
  path: string;
  handlers: BlockRendererHandlers;
}) {
  const [values, setValues] = useState<Record<string, WizardValue>>({});
  const onSubmitHandler = resolveHandler<FormSubmitHandler>(handlers, block.onSubmit);

  const setFieldValue = (label: string, value: WizardValue) => {
    setValues((prev) => ({ ...prev, [label]: value }));
  };

  return (
    <Card data-rebar-placement-block="form" data-rebar-block-path={path}>
      <Stack gap="md">
        {block.heading ? <Heading level={3}>{block.heading}</Heading> : null}
        {block.fields.map((field, fieldIndex) =>
          renderFormField(field, fieldIndex, path, values[field.label], setFieldValue),
        )}
        {block.submitLabel ? (
          <Button variant="primary" onClick={() => onSubmitHandler?.(values)}>
            {block.submitLabel}
          </Button>
        ) : null}
      </Stack>
    </Card>
  );
}

// Patches any top-level `iframe` block in `blocks` with a measured `height`, unless the document
// already set one explicitly (an explicit height always wins). An iframe has no natural content
// height, unlike everything else this schema renders — see schema.ts's doc comment on `iframe`.
function withMeasuredHeight(blocks: Construct[], height: number | undefined): Construct[] {
  if (height === undefined) return blocks;
  return blocks.map((block) => (block.type === "iframe" ? { ...block, height: block.height ?? height } : block));
}

// `renderBlock` is a plain function (recursive, imperative — see the `tabs` case above), not a
// component, so it can't itself use hooks. `comparison` is the first block that needs one (to
// measure the left panel's real rendered height via `ResizeObserver` and match it onto the right
// panel's iframe) — hence this dedicated component, delegated to from the `comparison` case below.
function ComparisonBlockView({
  block,
  index,
  path,
  renderLink,
  data,
  handlers,
}: {
  block: Extract<Construct, { type: "comparison" }>;
  index: number;
  path: string;
  renderLink: NonNullable<BlockRendererProps["renderLink"]>;
  data: BlockRendererData;
  handlers: BlockRendererHandlers;
}) {
  const leftRef = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = leftRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setLeftHeight(Math.round(rect.height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rightBlocks = withMeasuredHeight(block.rightBlocks, leftHeight);

  return (
    <Stack
      key={index}
      direction="row"
      gap="lg"
      style={{ flexWrap: "wrap", alignItems: "flex-start" }}
      data-rebar-placement-block="comparison"
      data-rebar-block-path={path}
    >
      <Stack gap="xs" style={{ flex: "1 1 380px", minWidth: 0 }}>
        <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)", textAlign: "center" }}>
          {block.leftLabel}
        </Text>
        <div ref={leftRef}>
          <Stack gap="lg" data-rebar-block-path={`${path}.leftBlocks`}>
            {block.leftBlocks.map((inner, innerIndex) =>
              renderBlock(inner, innerIndex, renderLink, `${path}.leftBlocks`, [], data, handlers),
            )}
          </Stack>
        </div>
      </Stack>
      <Stack gap="xs" style={{ flex: "1 1 380px", minWidth: 0 }}>
        <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)", textAlign: "center" }}>
          {block.rightLabel}
        </Text>
        <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, overflow: "hidden" }}>
          <Stack gap="lg" data-rebar-block-path={`${path}.rightBlocks`}>
            {rightBlocks.map((inner, innerIndex) =>
              renderBlock(inner, innerIndex, renderLink, `${path}.rightBlocks`, [], data, handlers),
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}

function KanbanBoardBlockView({
  block,
  index,
  path,
  renderLink,
  variant,
  data,
  handlers,
}: {
  block: Extract<Construct, { type: "card-kanban" | "sticky-kanban" }>;
  index: number;
  path: string;
  renderLink: NonNullable<BlockRendererProps["renderLink"]>;
  variant: "default" | "sticky";
  data: BlockRendererData;
  handlers: BlockRendererHandlers;
}) {
  const isLive = block.source !== undefined;
  const liveBoard = resolveSource<KanbanBoardSource>(data, block.source, {
    columns: block.columns ?? [],
    cards: block.cards ?? {},
  });
  const liveOnChange = resolveHandler<KanbanChangeHandler>(handlers, block.onChange);
  const [localBoard, setLocalBoard] = useState<KanbanBoardSource>({
    columns: block.columns ?? [],
    cards: block.cards ?? {},
  });
  const board = isLive ? liveBoard : localBoard;
  const handleBoardChange = (next: KanbanBoardSource) => {
    if (isLive) {
      liveOnChange?.(next);
      return;
    }
    setLocalBoard(next);
  };
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        block.shareUrl ?? (typeof window !== "undefined" ? window.location.href : ""),
      );
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack key={index} gap="md" data-rebar-placement-block={block.type} data-rebar-block-path={path}>
      <Stack direction="row" gap="sm" style={{ flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <Heading level={3} style={{ margin: 0 }}>
          {block.title}
        </Heading>
        <Stack direction="row" gap="sm" align="center">
          {block.sharedWith?.length ? (
            <div style={{ display: "flex" }} aria-label={`Shared with ${block.sharedWith.map((p) => p.name).join(", ")}`}>
              {block.sharedWith.map((person, personIndex) => (
                <span
                  key={person.name}
                  style={{
                    marginLeft: personIndex === 0 ? 0 : -8,
                    border: "2px solid var(--rebar-color-bg-primary, #ffffff)",
                    borderRadius: "50%",
                  }}
                >
                  <Avatar fallback={initials(person.name)} src={person.avatarSrc} alt={person.name} />
                </span>
              ))}
            </div>
          ) : null}
          <Button variant="secondary" size="sm" onClick={handleShare}>
            {copied ? "Copied!" : "Share"}
          </Button>
          {block.settingsBlocks ? (
            <Dialog
              title="Board settings"
              trigger={
                <Button variant="secondary" size="sm">
                  Board settings
                </Button>
              }
            >
              <Stack gap="md" data-rebar-block-path={`${path}.settingsBlocks`}>
                {block.settingsBlocks.map((inner, innerIndex) =>
                  renderBlock(inner, innerIndex, renderLink, `${path}.settingsBlocks`, [], data, handlers),
                )}
              </Stack>
            </Dialog>
          ) : null}
        </Stack>
      </Stack>
      <Input
        aria-label="Search cards"
        placeholder={block.searchPlaceholder ?? "Search cards..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Kanban columns={board.columns} cards={board.cards} search={search} cardVariant={variant} onChange={handleBoardChange} />
    </Stack>
  );
}

/**
 * A hierarchical goal/OKR tracker: one Aspiration, several Focus Areas, each holding several
 * Goals. Reclassified from a standalone `GoalTracker` component into this block — the real
 * reusable, directly-importable primitive was the smaller `TodoItem` (a checkable row with an
 * optional celebration burst), while the aspiration/focus-area/goal hierarchy plus inline editing
 * plus add/delete affordances is exactly "a named, pre-decided layout of real components" per
 * `agents.md`'s own component-vs-block test. Local-only state seeded from the block's literal
 * data, same convention `KanbanBoardBlockView` above already uses for its own board mutations.
 */
function GoalTrackerBlockView({
  block,
  index,
  path,
  data,
  handlers,
}: {
  block: Extract<Construct, { type: "goal-tracker" }>;
  index: number;
  path: string;
  data: BlockRendererData;
  handlers: BlockRendererHandlers;
}) {
  const isLive = block.source !== undefined;
  const liveState = resolveSource<GoalTrackerSource>(data, block.source, {
    aspiration: block.aspiration ?? "",
    focusAreas: block.focusAreas ?? [],
  });
  const onChangeHandler = resolveHandler<GoalTrackerChangeHandler>(handlers, block.onChange);

  const [localAspiration, setLocalAspiration] = useState(block.aspiration ?? "");
  const [localFocusAreas, setLocalFocusAreas] = useState<GoalTrackerFocusAreaData[]>(block.focusAreas ?? []);
  const nextIdRef = useRef(0);
  const celebration = block.celebration ?? "small";

  const aspiration = isLive ? liveState.aspiration : localAspiration;
  const focusAreas = isLive ? liveState.focusAreas : localFocusAreas;

  const nextId = (prefix: string) => `${prefix}-${nextIdRef.current++}`;

  const setAspirationValue = (next: string) => {
    if (isLive) {
      onChangeHandler?.({ aspiration: next, focusAreas });
      return;
    }
    setLocalAspiration(next);
  };
  const applyFocusAreasChange = (compute: (prev: GoalTrackerFocusAreaData[]) => GoalTrackerFocusAreaData[]) => {
    if (isLive) {
      onChangeHandler?.({ aspiration, focusAreas: compute(focusAreas) });
      return;
    }
    setLocalFocusAreas(compute);
  };

  const updateFocusArea = (id: string, text: string) => {
    applyFocusAreasChange((prev) => prev.map((fa) => (fa.id === id ? { ...fa, text } : fa)));
  };
  const updateGoal = (focusAreaId: string, goalId: string, text: string) => {
    applyFocusAreasChange((prev) =>
      prev.map((fa) =>
        fa.id !== focusAreaId ? fa : { ...fa, goals: fa.goals.map((g) => (g.id === goalId ? { ...g, text } : g)) },
      ),
    );
  };
  const toggleGoal = (focusAreaId: string, goalId: string, completed: boolean) => {
    applyFocusAreasChange((prev) =>
      prev.map((fa) =>
        fa.id !== focusAreaId
          ? fa
          : { ...fa, goals: fa.goals.map((g) => (g.id === goalId ? { ...g, completed } : g)) },
      ),
    );
  };
  const deleteFocusArea = (id: string) => applyFocusAreasChange((prev) => prev.filter((fa) => fa.id !== id));
  const deleteGoal = (focusAreaId: string, goalId: string) => {
    applyFocusAreasChange((prev) =>
      prev.map((fa) => (fa.id !== focusAreaId ? fa : { ...fa, goals: fa.goals.filter((g) => g.id !== goalId) })),
    );
  };
  const addFocusArea = () => {
    applyFocusAreasChange((prev) => [...prev, { id: nextId("focus-area"), text: "", goals: [] }]);
  };
  const addGoal = (focusAreaId: string) => {
    applyFocusAreasChange((prev) =>
      prev.map((fa) =>
        fa.id !== focusAreaId
          ? fa
          : { ...fa, goals: [...fa.goals, { id: nextId("goal"), text: "", completed: false }] },
      ),
    );
  };

  return (
    <Stack key={index} gap="lg" data-rebar-placement-block="goal-tracker" data-rebar-block-path={path}>
      <Stack gap="xs" data-rebar-part="aspiration">
        <Text size="xs" color="secondary" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Aspiration
        </Text>
        <Editable
          value={aspiration}
          onChange={setAspirationValue}
          aria-label="Aspiration"
          placeholder="Set an aspiration"
          className="rebar-goal-tracker-aspiration-text"
        />
      </Stack>

      {focusAreas.length === 0 ? (
        <Empty description="No focus areas yet" />
      ) : (
        <Stack gap="md">
          {focusAreas.map((focusArea, faIndex) => {
            const faPath = itemPath(path, "focusAreas", faIndex);
            const total = focusArea.goals.length;
            const completedCount = focusArea.goals.filter((g) => g.completed).length;
            return (
              <Card key={focusArea.id} data-rebar-block-path={faPath} data-rebar-block-item-label={focusArea.text}>
                <Stack gap="sm">
                  <Text size="xs" color="secondary" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Focus area
                  </Text>
                  <Stack direction="row" gap="sm" align="center" style={{ flexWrap: "wrap" }}>
                    <Editable
                      value={focusArea.text}
                      onChange={(text) => updateFocusArea(focusArea.id, text)}
                      aria-label="Focus area"
                      placeholder="Name this focus area"
                      className="rebar-goal-tracker-focus-area-text"
                    />
                    <Text size="sm" color="secondary" data-rebar-part="focus-area-progress">
                      {completedCount} of {total} complete
                    </Text>
                    <Popconfirm
                      trigger={
                        <Button type="button" variant="tertiary" aria-label={`Delete focus area "${focusArea.text}"`}>
                          Delete
                        </Button>
                      }
                      title={`Delete "${focusArea.text || "this focus area"}"?`}
                      description="This removes the focus area and all of its goals."
                      destructive
                      onConfirm={() => deleteFocusArea(focusArea.id)}
                    />
                  </Stack>

                  {focusArea.goals.length === 0 ? (
                    <Text size="sm" color="secondary" data-rebar-part="no-goals">
                      No goals yet
                    </Text>
                  ) : (
                    <Stack gap="sm">
                      {focusArea.goals.map((goal, goalIndex) => (
                        <Stack
                          key={goal.id}
                          direction="row"
                          gap="sm"
                          align="center"
                          data-rebar-block-path={itemPath(faPath, "goals", goalIndex)}
                          data-rebar-block-item-label={goal.text}
                        >
                          <TodoItem
                            label={
                              <Editable
                                value={goal.text}
                                onChange={(text) => updateGoal(focusArea.id, goal.id, text)}
                                aria-label="Goal"
                                placeholder="Name this goal"
                                className={goal.completed ? "rebar-todo-item-label-completed" : undefined}
                              />
                            }
                            completed={goal.completed}
                            onToggle={(completed) => toggleGoal(focusArea.id, goal.id, completed)}
                            toggleLabel={`Mark "${goal.text || "this goal"}" as ${goal.completed ? "incomplete" : "complete"}`}
                            celebration={celebration}
                            style={{ flex: "1 1 auto" }}
                          />
                          <Popconfirm
                            trigger={
                              <Button type="button" variant="tertiary" aria-label={`Delete goal "${goal.text}"`}>
                                Delete
                              </Button>
                            }
                            title={`Delete "${goal.text || "this goal"}"?`}
                            destructive
                            onConfirm={() => deleteGoal(focusArea.id, goal.id)}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  )}

                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    onClick={() => addGoal(focusArea.id)}
                    style={{ alignSelf: "flex-start" }}
                  >
                    + Add goal
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}

      <Button type="button" variant="secondary" onClick={addFocusArea} style={{ alignSelf: "flex-start" }}>
        + Add focus area
      </Button>
    </Stack>
  );
}

let aiChatNextId = 0;
function nextAiChatId() {
  aiChatNextId += 1;
  return `ai-chat-${aiChatNextId}`;
}

/**
 * A chat surface — `ChatThread` (the transcript) + `AiChatInput` (the composer), the exact
 * composition this project's own `AiChatInput` docs page already hand-authors. Local-only state
 * seeded from the block's literal `messages` (same convention `card-kanban`/`goal-tracker` already
 * use): sending appends the caller's own new message to the transcript — this is a static-render
 * demo surface, not a real backend, so it never fabricates an assistant reply, matching the same
 * hand-authored page's own behavior exactly (send appends, nothing more). `intent` is computed
 * from the current draft text the same way that page does (`/` → command, `?` → search) rather
 * than being a block-level setting, since it's inherently about *what's currently typed*, not a
 * fixed per-block config.
 */
function AiChatBlockView({
  block,
  index,
  path,
  data,
  handlers,
}: {
  block: Extract<Construct, { type: "ai-chat" }>;
  index: number;
  path: string;
  data: BlockRendererData;
  handlers: BlockRendererHandlers;
}) {
  const isLive = block.source !== undefined;
  const liveMessages = resolveSource<AiChatSource>(data, block.source, []);
  const liveOnSend = resolveHandler<AiChatSendHandler>(handlers, block.onSend);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(block.messages ?? []);
  const [draft, setDraft] = useState("");
  const [dictating, setDictating] = useState(false);

  const messages: ChatMessage[] = isLive ? liveMessages : localMessages;
  const trimmed = draft.trim();
  const intent: AiChatInputIntent = trimmed.startsWith("/") ? "command" : trimmed.startsWith("?") ? "search" : "message";

  const handleSend = (text: string) => {
    if (isLive) {
      liveOnSend?.(text);
      setDraft("");
      return;
    }
    setLocalMessages((prev) => [...prev, { id: nextAiChatId(), role: "user", content: text }]);
    setDraft("");
  };

  return (
    <Stack
      key={index}
      gap="sm"
      data-rebar-placement-block="ai-chat"
      data-rebar-block-path={path}
      style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-md, 16px)" }}
    >
      {block.title ? (
        <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>{block.title}</Text>
      ) : null}
      <div style={{ height: block.height ?? 240, overflowY: "auto" }}>
        <ChatThread messages={messages} />
      </div>
      <AiChatInput
        value={draft}
        onValueChange={setDraft}
        onSend={handleSend}
        intent={intent}
        placeholder={block.placeholder}
        dictation={block.dictation}
        dictating={dictating}
        onDictationToggle={setDictating}
      />
    </Stack>
  );
}

/**
 * A row of toggle buttons, one per series/segment label — the "footer and filter buttons to
 * control manipulation of the chart" a chart block needs to not just be its own canvas component
 * 1:1 (see ref/ARCHITECTURE.md on why a block always makes a real composition decision). Shared
 * across all three chart block types rather than duplicated per type, since the interaction (hide/
 * show a labeled series by clicking its own toggle) is identical regardless of chart shape.
 */
function ChartFilterFooter({
  labels,
  hidden,
  onToggle,
}: {
  labels: string[];
  hidden: Set<string>;
  onToggle: (label: string) => void;
}) {
  if (labels.length <= 1) return null;
  return (
    <Stack direction="row" gap="xs" style={{ flexWrap: "wrap" }} data-rebar-part="chart-filters">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          className={
            hidden.has(label) ? "rebar-chart-filter-button rebar-chart-filter-button-inactive" : "rebar-chart-filter-button"
          }
          aria-pressed={!hidden.has(label)}
          onClick={() => onToggle(label)}
        >
          {label}
        </button>
      ))}
    </Stack>
  );
}

function useSeriesFilter(_labels: string[]) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (label: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };
  return { hidden, toggle, visible: (label: string) => !hidden.has(label) };
}

function ScatterChartBlockView({
  block,
  index,
  path,
  data,
}: {
  block: Extract<Construct, { type: "scatter-chart" }>;
  index: number;
  path: string;
  data: BlockRendererData;
}) {
  const series = resolveSource<ScatterChartSource>(data, block.source, block.series);
  const labels = series.map((s) => s.label);
  const { hidden, toggle, visible } = useSeriesFilter(labels);
  return (
    <Stack key={index} gap="sm" data-rebar-placement-block="scatter-chart" data-rebar-block-path={path}>
      <ScatterChart
        series={series.filter((s) => visible(s.label))}
        title={block.title}
        ariaLabel={block.ariaLabel}
        height={block.height}
      />
      <ChartFilterFooter labels={labels} hidden={hidden} onToggle={toggle} />
    </Stack>
  );
}

function LineChartBlockView({
  block,
  index,
  path,
  data,
}: {
  block: Extract<Construct, { type: "line-chart" }>;
  index: number;
  path: string;
  data: BlockRendererData;
}) {
  const series = resolveSource<LineChartSource>(data, block.source, block.series);
  const labels = series.map((s) => s.label);
  const { hidden, toggle, visible } = useSeriesFilter(labels);
  return (
    <Stack key={index} gap="sm" data-rebar-placement-block="line-chart" data-rebar-block-path={path}>
      <LineChart
        series={series.filter((s) => visible(s.label))}
        xLabels={block.xLabels}
        labelStep={block.labelStep}
        crossoverIndex={block.crossoverIndex}
        title={block.title}
        ariaLabel={block.ariaLabel}
        height={block.height}
      />
      <ChartFilterFooter labels={labels} hidden={hidden} onToggle={toggle} />
    </Stack>
  );
}

function StackedBarChartBlockView({
  block,
  index,
  path,
  data,
}: {
  block: Extract<Construct, { type: "stacked-bar-chart" }>;
  index: number;
  path: string;
  data: BlockRendererData;
}) {
  const bars = resolveSource<StackedBarChartSource>(data, block.source, block.bars);
  // The "series" a stacked bar chart's viewer thinks in are the distinct segment labels repeated
  // across every bar (a legend of categories), not the bars themselves — filtering one out drops
  // that segment from every bar, not a whole bar.
  const labels = [...new Set(bars.flatMap((bar) => bar.segments.map((s) => s.label)))];
  const { hidden, toggle, visible } = useSeriesFilter(labels);
  return (
    <Stack key={index} gap="sm" data-rebar-placement-block="stacked-bar-chart" data-rebar-block-path={path}>
      <StackedBarChart
        bars={bars.map((bar) => ({ ...bar, segments: bar.segments.filter((s) => visible(s.label)) }))}
        title={block.title}
        ariaLabel={block.ariaLabel}
        height={block.height}
      />
      <ChartFilterFooter labels={labels} hidden={hidden} onToggle={toggle} />
    </Stack>
  );
}

function StatsTableBlockView({
  block,
  index,
  path,
}: {
  block: Extract<Construct, { type: "stats-table" }>;
  index: number;
  path: string;
}) {
  const columns: TableColumn<Record<string, string | number>>[] = block.headers.map((header, i) => ({
    key: String(i),
    header,
  }));
  const data = block.rows.map((cells, rowIndex) => {
    const row: Record<string, string | number> = { __rowKey: rowIndex };
    cells.forEach((cell, cellIndex) => {
      row[String(cellIndex)] = cell;
    });
    return row;
  });
  return (
    <Box key={index} data-rebar-placement-block="stats-table" data-rebar-block-path={path}>
      <Table columns={columns} data={data} rowKey="__rowKey" />
    </Box>
  );
}

function GalleryBlockView({
  block,
  index,
  path,
}: {
  block: Extract<Construct, { type: "gallery" }>;
  index: number;
  path: string;
}) {
  const count = block.count ?? 15;
  return (
    <Stack key={index} gap="xs" data-rebar-placement-block="gallery" data-rebar-block-path={path}>
      <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
        {block.label}
      </Text>
      <Carousel aria-label={`${block.label} screenshots`}>
        {Array.from({ length: count }, (_, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            <Box key={n} style={{ maxWidth: 360, margin: "0 auto" }}>
              <img
                src={`${block.dir}/${block.prefix}-${n}.png`}
                alt={`${block.label}, run ${n}`}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Box>
          );
        })}
      </Carousel>
    </Stack>
  );
}

/** How many named filters render inline before the rest collapse into a "More filters" popover —
 * the same bounded-then-collapse convention `nav-bar`'s own overflow uses (ref/HEURISTICS.md "Nav
 * overflow"), just a fixed threshold here rather than a live-measured one, since a `table` block's
 * filter row doesn't need to react to arbitrary viewport widths the way a site nav does. */
const INLINE_FILTER_LIMIT = 2;

// RFC 4180-ish: a cell needing quoting (contains a comma, quote, or newline) gets wrapped in
// quotes with any internal quote doubled — the minimum a spreadsheet reliably round-trips.
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function rowsToCsv(columns: string[], rows: string[][]): string {
  const lines = [columns, ...rows].map((cells) => cells.map(csvCell).join(","));
  return lines.join("\r\n");
}

// Tab-separated, not comma — this is what Excel/Sheets expect on the clipboard for a clean paste,
// not a downloaded file. A literal tab/newline inside a cell would corrupt the grid on paste, so
// both are flattened to a single space rather than escaped (there's no clipboard-TSV quoting
// convention spreadsheets agree on, unlike CSV's).
function rowsToTsv(columns: string[], rows: string[][]): string {
  const flatten = (cell: string) => cell.replace(/[\t\n]/g, " ");
  const lines = [columns, ...rows].map((cells) => cells.map(flatten).join("\t"));
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function DataTableBlockView({
  block,
  index,
  path,
  data,
  handlers,
}: {
  block: Extract<Construct, { type: "table" }>;
  index: number;
  path: string;
  data: BlockRendererData;
  handlers: BlockRendererHandlers;
}) {
  const isLive = block.source !== undefined;
  const liveRows = resolveSource<TableSource>(data, block.source, []);
  const [localRows, setLocalRows] = useState(block.rows ?? []);
  const activeRows = isLive ? liveRows : localRows;

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<number, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [draftCells, setDraftCells] = useState<string[]>(() => block.columns.map(() => ""));
  const [copied, setCopied] = useState(false);

  const onRowActionHandler = resolveHandler<TableRowActionHandler>(handlers, block.onRowAction);
  const onAddRowHandler = resolveHandler<TableAddRowHandler>(handlers, block.onAddRow);

  const hasActions = activeRows.some((r) => r.actionLabel);
  const columns: TableColumn<Record<string, unknown>>[] = block.columns.map((header, i) => ({
    key: String(i),
    header,
    sortable: block.sortable !== false,
  }));
  if (hasActions) {
    columns.push({
      key: "__actions",
      header: "",
      render: (_value, row) =>
        row.__actionLabel ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRowActionHandler?.(row.__rowKey as number, activeRows[row.__rowKey as number]!)}
          >
            {row.__actionLabel as string}
          </Button>
        ) : null,
    });
  }

  const rows = activeRows.map((row, rowIndex) => {
    const record: Record<string, unknown> = { __rowKey: rowIndex, __actionLabel: row.actionLabel };
    row.cells.forEach((cell, cellIndex) => {
      record[String(cellIndex)] = cell;
    });
    return record;
  });

  const needle = search.trim().toLowerCase();
  const visibleRows = rows.filter((row) => {
    if (needle && !block.columns.some((_, i) => String(row[String(i)] ?? "").toLowerCase().includes(needle))) {
      return false;
    }
    return Object.entries(activeFilters).every(([columnIndex, value]) => {
      if (!value) return true;
      return String(row[columnIndex] ?? "") === value;
    });
  });
  const visibleCells = visibleRows.map((row) => block.columns.map((_, i) => String(row[String(i)] ?? "")));

  const filters = block.filters ?? [];
  const inlineFilters = filters.slice(0, INLINE_FILTER_LIMIT);
  const overflowFilters = filters.slice(INLINE_FILTER_LIMIT);

  const renderFilterSelect = (filter: TableFilter) => (
    <Select
      key={filter.label}
      aria-label={filter.label}
      value={activeFilters[filter.columnIndex] ?? ""}
      onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, [filter.columnIndex]: value }))}
      options={[{ value: "", label: `${filter.label}: All` }, ...filter.options.map((o) => ({ value: o, label: o }))]}
    />
  );

  const addLabel = (typeof block.addable === "object" && block.addable.label) || "Add row";
  const handleAddSubmit = () => {
    if (isLive) {
      onAddRowHandler?.(draftCells);
    } else {
      setLocalRows((prev) => [...prev, { cells: draftCells }]);
    }
    setDraftCells(block.columns.map(() => ""));
    setAddOpen(false);
  };
  const handleExport = () => downloadCsv("table.csv", rowsToCsv(block.columns, visibleCells));
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rowsToTsv(block.columns, visibleCells));
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasToolbar = block.searchPlaceholder || filters.length || block.addable || block.exportable || block.copyable;

  return (
    <Stack key={index} gap="sm" data-rebar-placement-block="table" data-rebar-block-path={path}>
      {hasToolbar ? (
        <Stack direction="row" gap="sm" style={{ flexWrap: "wrap", alignItems: "center" }} data-rebar-part="table-controls">
          {block.searchPlaceholder ? (
            <Input
              aria-label={block.searchPlaceholder}
              placeholder={block.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 240 }}
            />
          ) : null}
          {inlineFilters.map(renderFilterSelect)}
          {overflowFilters.length ? (
            <Popover trigger={<Button variant="secondary" size="sm">More filters</Button>}>
              <Stack gap="sm" style={{ minWidth: 180 }}>
                {overflowFilters.map(renderFilterSelect)}
              </Stack>
            </Popover>
          ) : null}
          <Stack direction="row" gap="sm" style={{ marginLeft: "auto" }}>
            {block.copyable ? (
              <Button variant="secondary" size="sm" onClick={handleCopy} aria-live="polite" data-rebar-part="copy-button">
                {copied ? "Copied!" : "Copy"}
              </Button>
            ) : null}
            {block.exportable ? (
              <Button variant="secondary" size="sm" onClick={handleExport} data-rebar-part="export-button">
                Export CSV
              </Button>
            ) : null}
            {block.addable ? (
              <Dialog
                open={addOpen}
                onOpenChange={setAddOpen}
                trigger={<Button variant="primary" size="sm" data-rebar-part="add-button">{addLabel}</Button>}
                title={addLabel}
                footer={
                  <>
                    <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAddSubmit}>{addLabel}</Button>
                  </>
                }
              >
                <Stack gap="sm">
                  {block.columns.map((header, i) => (
                    <Input
                      key={header}
                      aria-label={header}
                      placeholder={header}
                      value={draftCells[i] ?? ""}
                      onChange={(e) =>
                        setDraftCells((prev) => prev.map((cell, cellIndex) => (cellIndex === i ? e.target.value : cell)))
                      }
                    />
                  ))}
                </Stack>
              </Dialog>
            ) : null}
          </Stack>
        </Stack>
      ) : null}
      <Table
        columns={columns}
        data={visibleRows}
        rowKey="__rowKey"
        loading={block.loading}
      />
    </Stack>
  );
}

function renderBlock(
  block: Construct,
  index: number,
  renderLink: NonNullable<BlockRendererProps["renderLink"]>,
  parentPath = "blocks",
  pageSections: { id: string; label: string }[] = [],
  data: BlockRendererData = {},
  handlers: BlockRendererHandlers = {},
) {
  const path = `${parentPath}[${index}]`;
  switch (block.type) {
    case "header": {
      const Icon = block.action?.icon ? ICONS[block.action.icon] : null;
      return (
        <Stack
          key={index}
          direction="row"
          align="center"
          justify="between"
          data-rebar-placement-block="header"
          data-rebar-block-path={path}
        >
          <Heading level={2} style={{ margin: 0 }}>
            {block.title}
          </Heading>
          {block.action ? (
            <Button variant="tertiary" size="sm" aria-label={block.action.label ?? "Close"}>
              {Icon ? <Icon /> : null}
            </Button>
          ) : null}
        </Stack>
      );
    }

    case "nav-bar":
      if (block.resizable) {
        return (
          <Box
            key={index}
            data-rebar-placement-block="nav-bar"
            data-rebar-block-path={path}
            style={{
              border: "1px solid var(--rebar-color-border, #e0e0e0)",
              borderRadius: 4,
              padding: "var(--rebar-space-lg)",
              resize: "horizontal",
              overflow: "auto",
              width: 320,
              minWidth: 120,
              maxWidth: "100%",
            }}
          >
            <NavBar items={block.items} aria-label={block.ariaLabel ?? "Main"} renderLink={renderLink} />
          </Box>
        );
      }
      return (
        <NavBar
          key={index}
          items={block.items}
          aria-label={block.ariaLabel ?? "Main"}
          renderLink={renderLink}
          data-rebar-placement-block="nav-bar"
          data-rebar-block-path={path}
        />
      );

    case "site-header": {
      const logoContent = (
        // A logo/wordmark is never underlined, even when linked — but `renderLink`'s abstraction
        // (a caller-supplied function) doesn't expose a way to set style on the `<a>` it returns,
        // so the underline an ancestor link paints across inline descendants has to be interrupted
        // from inside instead: `display: inline-block` + an explicit `textDecoration: none` on this
        // wrapper stops that painted line from continuing through it (a standard, well-established
        // CSS technique — text-decoration otherwise propagates through plain inline descendants
        // regardless of their own value).
        <span style={{ display: "inline-block", textDecoration: "none" }}>
          <Stack direction="row" align="center" gap="xs">
            {block.logo.iconPath ? (
              <svg
                viewBox={block.logo.iconViewBox ?? "0 0 24 24"}
                width={24}
                height={24}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={block.logo.iconPath} />
              </svg>
            ) : block.logo.iconSrc ? (
              <img src={block.logo.iconSrc} alt="" width={24} height={24} />
            ) : null}
            <Text as="span" size="md" style={{ fontWeight: "var(--rebar-font-weight-bold, 700)" }}>
              {block.logo.label}
            </Text>
          </Stack>
        </span>
      );
      let trailingContent: ReactNode = null;
      if (block.trailing?.kind === "text") {
        trailingContent = (
          <Text size="xs" color="secondary" style={{ flexShrink: 0 }}>
            {block.trailing.text}
          </Text>
        );
      } else if (block.trailing?.kind === "login") {
        const button = (
          <Button variant="secondary" size="sm">
            {block.trailing.label ?? "Log in"}
          </Button>
        );
        trailingContent = (
          <span style={{ flexShrink: 0 }}>
            {block.trailing.href ? renderLink({ href: block.trailing.href, children: button }) : button}
          </span>
        );
      } else if (block.trailing?.kind === "avatar") {
        const avatar = (
          <span aria-label={block.trailing.name}>
            <Avatar
              fallback={initials(block.trailing.name)}
              src={block.trailing.avatarSrc}
              placeholder={block.trailing.placeholder}
            />
          </span>
        );
        trailingContent = (
          <span style={{ flexShrink: 0 }}>
            {block.trailing.href ? renderLink({ href: block.trailing.href, children: avatar }) : avatar}
          </span>
        );
      }
      return (
        <Box
          key={index}
          as="header"
          data-rebar-placement-block="site-header"
          data-rebar-block-path={path}
          style={{ borderBottom: "var(--rebar-border-width, 1px) solid var(--rebar-color-border, #e0e0e0)" }}
        >
          <Stack
            direction="row"
            align="center"
            gap="lg"
            style={{ padding: "var(--rebar-space-md) var(--rebar-space-xl)" }}
          >
            <span style={{ flexShrink: 0 }}>
              {block.logo.href ? renderLink({ href: block.logo.href, children: logoContent }) : logoContent}
            </span>
            <div style={{ flex: "0 1 50%", minWidth: 0 }}>
              <NavBar items={block.items} aria-label={block.ariaLabel ?? "Main"} renderLink={renderLink} />
            </div>
            {trailingContent || block.themeToggle ? (
              <Stack direction="row" align="center" gap="sm" style={{ marginLeft: "auto", flexShrink: 0 }}>
                {block.themeToggle ? <ThemeToggle /> : null}
                {trailingContent}
              </Stack>
            ) : null}
          </Stack>
        </Box>
      );
    }

    case "nav-index":
      return (
        <NavIndex
          key={index}
          items={block.items}
          categoryLabels={block.categoryLabels}
          statusLabels={block.statusLabels}
          unstatusedLabel={block.unstatusedLabel}
          searchPlaceholder={block.searchPlaceholder}
          aria-label={block.ariaLabel ?? "Page index"}
          renderLink={renderLink}
          data-rebar-placement-block="nav-index"
          data-rebar-block-path={path}
        />
      );

    case "page-index":
      return (
        <SectionNav
          key={index}
          sections={block.sections ?? pageSections}
          searchPlaceholder={block.searchPlaceholder}
          data-rebar-placement-block="page-index"
          data-rebar-block-path={path}
        />
      );

    case "banner": {
      const Icon = block.icon ? ICONS[block.icon] : null;
      return (
        <Alert key={index} type={block.tone} data-rebar-placement-block="banner" data-rebar-block-path={path}>
          <Stack direction="row" align="center" justify="between" gap="sm">
            <Stack direction="row" align="center" gap="sm">
              {Icon ? <Icon /> : null}
              <Text as="span" size="sm">
                {block.text}
              </Text>
            </Stack>
            {renderAction(block.action, renderLink)}
          </Stack>
        </Alert>
      );
    }

    case "checklist":
      return (
        <Stack key={index} gap="sm" data-rebar-placement-block="checklist" data-rebar-block-path={path}>
          {block.heading ? <Heading level={3}>{block.heading}</Heading> : null}
          <Stack gap="sm">
            {block.items.map((label, itemIndex) => (
              <Card
                key={label}
                data-rebar-block-path={itemPath(path, "items", itemIndex)}
                data-rebar-block-item-label={label}
              >
                <Checkbox>{label}</Checkbox>
              </Card>
            ))}
          </Stack>
        </Stack>
      );

    case "goal-tracker":
      return <GoalTrackerBlockView key={index} block={block} index={index} path={path} data={data} handlers={handlers} />;

    case "ai-chat":
      return <AiChatBlockView key={index} block={block} index={index} path={path} data={data} handlers={handlers} />;

    case "callout": {
      const Icon = block.icon ? ICONS[block.icon] : null;
      return (
        <Alert key={index} type={block.tone} data-rebar-placement-block="callout" data-rebar-block-path={path}>
          <Stack direction="row" align="start" gap="sm">
            {Icon ? <Icon /> : null}
            <Stack gap="xs">
              <Text as="span" style={{ fontWeight: 700 }}>
                {block.title}
              </Text>
              {block.subtitle ? (
                <Text as="span" size="sm" color="secondary">
                  {block.subtitle}
                </Text>
              ) : null}
            </Stack>
          </Stack>
        </Alert>
      );
    }

    case "feature-grid":
      return (
        <Stack
          key={index}
          direction="row"
          gap="xl"
          style={{ flexWrap: "wrap", justifyContent: "center" }}
          data-rebar-placement-block="feature-grid"
          data-rebar-block-path={path}
        >
          {block.items.map((item, itemIndex) => (
            <Stack
              key={item.title}
              gap="xs"
              style={{ maxWidth: 200, textAlign: "center" }}
              data-rebar-block-path={itemPath(path, "items", itemIndex)}
              data-rebar-block-item-label={item.title}
            >
              <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
                {item.title}
              </Text>
              <Text size="xs" color="secondary">
                {item.body}
              </Text>
            </Stack>
          ))}
        </Stack>
      );

    case "pillar-grid":
      return (
        <Stack
          key={index}
          direction="row"
          gap="lg"
          style={{ flexWrap: "wrap" }}
          data-rebar-placement-block="pillar-grid"
          data-rebar-block-path={path}
        >
          {block.items.map((item, itemIndex) => (
            <Card
              key={item.title}
              style={{ flex: "1 1 260px" }}
              data-rebar-block-path={itemPath(path, "items", itemIndex)}
              data-rebar-block-item-label={item.title}
            >
              <Stack gap="sm">
                <Heading level={3}>{item.title}</Heading>
                <Text size="sm" color="secondary">
                  {item.body}
                </Text>
                {renderLink({
                  href: item.href,
                  children: (
                    <Button variant="secondary" size="sm">
                      {item.cta}
                    </Button>
                  ),
                })}
              </Stack>
            </Card>
          ))}
        </Stack>
      );

    case "card-grid":
      return (
        <Stack
          key={index}
          direction="row"
          gap="md"
          style={{ flexWrap: "wrap" }}
          data-rebar-placement-block="card-grid"
          data-rebar-block-path={path}
        >
          {block.items.map((item, itemIndex) => (
            <Card
              key={`${item.title}-${itemIndex}`}
              style={{ flex: "1 1 200px" }}
              data-rebar-block-path={itemPath(path, "items", itemIndex)}
              data-rebar-block-item-label={item.title}
            >
              <Stack gap="xs">
                <Stack direction="row" gap="xs" style={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Text style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
                    {item.title}
                  </Text>
                  {item.tags?.map((tag) => (
                    <Tag key={tag.label} tone={tag.tone ?? "default"}>
                      {tag.label}
                    </Tag>
                  ))}
                </Stack>
                {item.body ? (
                  <Text size="sm" color="secondary">
                    {item.body}
                  </Text>
                ) : null}
                {item.href
                  ? renderLink({
                      href: item.href,
                      children: (
                        <Text as="span" size="sm">
                          {item.linkLabel ?? "View →"}
                        </Text>
                      ),
                    })
                  : null}
              </Stack>
            </Card>
          ))}
        </Stack>
      );

    case "persona-card":
      return (
        <Stack
          key={index}
          direction="row"
          gap="md"
          style={{ flexWrap: "wrap" }}
          data-rebar-placement-block="persona-card"
          data-rebar-block-path={path}
        >
          {block.items.map((item, itemIndex) => (
            <Card
              key={`${item.name}-${itemIndex}`}
              style={{ flex: "1 1 220px" }}
              data-rebar-block-path={itemPath(path, "items", itemIndex)}
              data-rebar-block-item-label={item.name}
            >
              <Stack direction="row" align="center" gap="sm">
                <Avatar
                  src={item.avatarSrc}
                  fallback={initials(item.name)}
                  placeholder={item.avatarPlaceholder}
                />
                <Stack gap="xs">
                  <Text as="span" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
                    {item.name}
                  </Text>
                  {item.meta ? (
                    <Text as="span" size="sm" color="secondary">
                      {item.meta}
                    </Text>
                  ) : null}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      );

    case "form":
      return <FormBlockView key={index} block={block} path={path} handlers={handlers} />;

    case "table":
      return <DataTableBlockView key={index} block={block} index={index} path={path} data={data} handlers={handlers} />;

    case "data-list":
      return (
        <Stack key={index} gap="sm" data-rebar-placement-block="data-list" data-rebar-block-path={path}>
          {block.items.map((item, itemIndex) => (
            <Card
              key={`${item.title}-${itemIndex}`}
              data-rebar-block-path={itemPath(path, "items", itemIndex)}
              data-rebar-block-item-label={item.title}
            >
              <Stack direction="row" align="center" justify="between" gap="sm">
                <Stack direction="row" align="center" gap="sm">
                  {item.avatarSrc || item.avatarPlaceholder ? (
                    <Avatar
                      src={item.avatarSrc}
                      fallback={initials(item.title)}
                      placeholder={item.avatarPlaceholder}
                    />
                  ) : null}
                  <Stack gap="xs">
                    <Text as="span">{item.title}</Text>
                    {item.meta ? (
                      <Text as="span" size="xs" color="secondary">
                        {item.meta}
                      </Text>
                    ) : null}
                  </Stack>
                </Stack>
                <Stack direction="row" align="center" gap="sm">
                  {item.badge ? (
                    <Text as="span" size="xs" color="secondary">
                      {item.badge}
                    </Text>
                  ) : null}
                  {renderAction(item.action, renderLink)}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      );

    case "filter-bar":
      return (
        <Stack
          key={index}
          direction="row"
          gap="sm"
          align="center"
          justify="between"
          style={{ flexWrap: "wrap" }}
          data-rebar-placement-block="filter-bar"
          data-rebar-block-path={path}
        >
          <Stack direction="row" gap="sm" style={{ flexWrap: "wrap" }}>
            <Input placeholder={block.searchPlaceholder ?? "Search"} style={{ minWidth: 200 }} />
            {block.filterOptions ? (
              <Select
                aria-label={block.filterLabel ?? "Filter"}
                options={block.filterOptions.map((o) => ({ value: o, label: o }))}
                placeholder={block.filterOptions[0]}
              />
            ) : null}
          </Stack>
          {block.actionLabel ? <Button variant="primary">{block.actionLabel}</Button> : null}
        </Stack>
      );

    case "tabs":
      return (
        <Tabs key={index} defaultValue={block.tabs[0]?.label} data-rebar-placement-block="tabs" data-rebar-block-path={path}>
          <TabList>
            {block.tabs.map((tab, tabIndex) => (
              <Tab
                key={tab.label}
                value={tab.label}
                data-rebar-block-path={itemPath(path, "tabs", tabIndex)}
                data-rebar-block-item-label={tab.label}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>
          {block.tabs.map((tab, tabIndex) => (
            <TabPanel key={tab.label} value={tab.label}>
              <Stack gap="lg" style={{ paddingTop: "var(--rebar-space-md)" }}>
                {tab.blocks.map((inner, innerIndex) =>
                  renderBlock(
                    inner,
                    innerIndex,
                    renderLink,
                    `${itemPath(path, "tabs", tabIndex)}.blocks`,
                    [],
                    data,
                    handlers,
                  ),
                )}
              </Stack>
            </TabPanel>
          ))}
        </Tabs>
      );

    case "modal":
      return (
        <Dialog
          key={index}
          open
          title={block.title}
          footer={
            <Stack direction="row" gap="sm" justify="end">
              {block.cancelLabel ? <Button variant="secondary">{block.cancelLabel}</Button> : null}
              {block.confirmLabel ? <Button variant="primary">{block.confirmLabel}</Button> : null}
            </Stack>
          }
        >
          <Stack gap="md" data-rebar-placement-block="modal" data-rebar-block-path={path}>
            {block.blocks.map((inner, innerIndex) =>
              renderBlock(inner, innerIndex, renderLink, `${path}.blocks`, [], data, handlers),
            )}
          </Stack>
        </Dialog>
      );

    case "wizard":
      return (
        <Wizard
          key={index}
          steps={block.steps}
          submitLabel={block.submitLabel}
          backLabel={block.backLabel}
          nextLabel={block.nextLabel}
          onSubmit={resolveHandler<WizardSubmitHandler>(handlers, block.onSubmit)}
          data-rebar-placement-block="wizard"
          data-rebar-block-path={path}
        />
      );

    case "card-kanban":
      return (
        <KanbanBoardBlockView
          key={index}
          block={block}
          index={index}
          path={path}
          renderLink={renderLink}
          variant="default"
          data={data}
          handlers={handlers}
        />
      );

    case "sticky-kanban":
      return (
        <KanbanBoardBlockView
          key={index}
          block={block}
          index={index}
          path={path}
          renderLink={renderLink}
          variant="sticky"
          data={data}
          handlers={handlers}
        />
      );

    case "hero":
      return (
        <Stack
          key={index}
          gap="lg"
          style={{ alignItems: "center", textAlign: "center" }}
          data-rebar-placement-block="hero"
          data-rebar-block-path={path}
        >
          {block.badge ? (
            <Box
              style={{
                display: "inline-block",
                padding: "var(--rebar-space-xs) var(--rebar-space-md)",
                background: "var(--rebar-color-bg-secondary, #f5f5f5)",
                border: "var(--rebar-border-width, 1px) solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 999,
                fontSize: "var(--rebar-font-size-xs)",
              }}
            >
              {renderInline(block.badge, renderLink)}
            </Box>
          ) : null}
          <Heading level={1} style={{ fontSize: 56, lineHeight: 1.1 }}>
            {block.title}
          </Heading>
          <Text size="md" color="secondary" style={{ maxWidth: 560 }}>
            {renderInline(block.subtitle, renderLink)}
          </Text>
          {block.actions && block.actions.length > 0 ? (
            <Stack direction="row" gap="sm">
              {block.actions.map((action, actionIndex) => {
                const button = (
                  <Button variant={action.variant ?? "secondary"} size="lg">
                    {action.label}
                  </Button>
                );
                return (
                  <span key={actionIndex}>
                    {action.href ? renderLink({ href: action.href, children: button }) : button}
                  </span>
                );
              })}
            </Stack>
          ) : null}
          {block.codeSnippet ? (
            <Box
              as="code"
              style={{
                display: "inline-block",
                padding: "var(--rebar-space-sm) var(--rebar-space-md)",
                background: "var(--rebar-color-bg-secondary, #f5f5f5)",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              {block.codeSnippet}
            </Box>
          ) : null}
        </Stack>
      );

    case "section-header":
      return (
        <Stack
          key={index}
          gap="sm"
          style={{ alignItems: "center", textAlign: "center", maxWidth: 640, margin: "0 auto" }}
          data-rebar-placement-block="section-header"
          data-rebar-block-path={path}
        >
          {block.kicker ? (
            <Text
              size="sm"
              color="secondary"
              style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "var(--rebar-font-weight-semibold)" }}
            >
              {block.kicker}
            </Text>
          ) : null}
          <Heading level={2}>{block.title}</Heading>
          {block.subtitle ? <Text color="secondary">{renderInline(block.subtitle, renderLink)}</Text> : null}
        </Stack>
      );

    case "doc-section":
      return (
        <Stack key={index} gap="sm" data-rebar-placement-block="doc-section" data-rebar-block-path={path}>
          {block.heading ? (
            <Heading level={block.level ?? 2} id={slugify(block.heading)}>
              {block.heading}
            </Heading>
          ) : null}
          {block.body.map((node, nodeIndex) => renderProseNode(node, nodeIndex, renderLink))}
        </Stack>
      );

    case "props-table":
      if (block.rows.length === 0) {
        return (
          <Stack key={index} gap="sm" data-rebar-placement-block="props-table" data-rebar-block-path={path}>
            {block.heading ? <Heading level={2}>{block.heading}</Heading> : null}
            <Text size="sm" color="secondary">
              No component-specific props (only standard HTML/ARIA attributes, forwarded as-is).
            </Text>
          </Stack>
        );
      }
      return (
        <Stack key={index} gap="sm" data-rebar-placement-block="props-table" data-rebar-block-path={path}>
          {block.heading ? <Heading level={2}>{block.heading}</Heading> : null}
          <Box style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--rebar-font-size-sm, 14px)" }}>
            <thead>
              <tr>
                {["Prop", "Type", "Required", "Default"].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: "var(--rebar-space-sm, 8px)",
                      borderBottom: "2px solid var(--rebar-color-border-strong, #333)",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.name}>
                  <td style={propsTableCellStyle}>
                    <code>{row.name}</code>
                  </td>
                  <td style={propsTableCellStyle}>
                    <code>{row.type}</code>
                  </td>
                  <td style={propsTableCellStyle}>{row.required ? "Yes" : "No"}</td>
                  <td style={propsTableCellStyle}>{row.defaultValue ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </Box>
        </Stack>
      );

    case "iframe":
      return (
        <Iframe
          key={index}
          src={block.src}
          title={block.title}
          style={{ height: block.height ?? 300 }}
          data-rebar-placement-block="iframe"
          data-rebar-block-path={path}
        />
      );

    case "comparison":
      return (
        <ComparisonBlockView
          key={index}
          block={block}
          index={index}
          path={path}
          renderLink={renderLink}
          data={data}
          handlers={handlers}
        />
      );

    case "side-panel":
      return (
        <Stack
          key={index}
          direction="row"
          gap="lg"
          style={{ alignItems: "stretch" }}
          data-rebar-placement-block="side-panel"
          data-rebar-block-path={path}
        >
          <Box style={{ flex: "1 1 auto", minWidth: 0 }}>
            <Stack gap="lg" data-rebar-block-path={`${path}.main`}>
              {block.main.map((inner, innerIndex) =>
                renderBlock(inner, innerIndex, renderLink, `${path}.main`, [], data, handlers),
              )}
            </Stack>
          </Box>
          <SidePanel
            title={block.panel.title}
            defaultOpen={block.panel.defaultOpen ?? true}
            data-rebar-block-path={`${path}.panel`}
          >
            <Stack gap="md" data-rebar-block-path={`${path}.panel.blocks`}>
              {block.panel.blocks.map((inner, innerIndex) =>
                renderBlock(inner, innerIndex, renderLink, `${path}.panel.blocks`, [], data, handlers),
              )}
            </Stack>
          </SidePanel>
        </Stack>
      );

    case "heuristic":
      return (
        <Stack key={index} gap="sm" id={block.id} data-rebar-placement-block="heuristic" data-rebar-block-path={path}>
          <Heading level={2}>{block.title}</Heading>
          <Text size="sm" style={{ fontWeight: "var(--rebar-font-weight-semibold)" }}>
            {renderInline(block.rule, renderLink)}
          </Text>
          {block.rationale.map((node, nodeIndex) => renderProseNode(node, nodeIndex, renderLink))}
          {block.code ? renderProseNode({ kind: "code", code: block.code }, block.rationale.length, renderLink) : null}
          {block.exampleBlocks ? (
            <Box
              style={{
                border: "1px solid var(--rebar-color-border, #e0e0e0)",
                borderRadius: 4,
                padding: "var(--rebar-space-lg)",
              }}
            >
              {block.exampleBlocks.map((inner, innerIndex) =>
                renderBlock(inner, innerIndex, renderLink, `${path}.exampleBlocks`, [], data, handlers),
              )}
            </Box>
          ) : null}
        </Stack>
      );

    case "spin-card":
      return (
        <Box
          key={index}
          data-rebar-placement-block="spin-card"
          data-rebar-block-path={path}
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: 4,
            padding: "var(--rebar-space-lg)",
          }}
        >
          <Card style={{ width: block.width ?? 220, minHeight: block.minHeight ?? 120, margin: "0 auto" }}>
            <Spin spinning tip={block.tip ?? "Loading"}>
              <Stack gap="sm">
                {block.items.map((item, itemIndex) => (
                  <Text key={itemIndex} size="sm" data-rebar-block-path={itemPath(path, "items", itemIndex)}>
                    {item}
                  </Text>
                ))}
              </Stack>
            </Spin>
          </Card>
        </Box>
      );

    case "error-block":
      return (
        <ErrorBlock
          key={index}
          status={block.status ?? "default"}
          title={block.title}
          description={block.description}
          fullPage={block.fullPage ?? true}
          data-rebar-placement-block="error-block"
          data-rebar-block-path={path}
        >
          {renderAction(block.action, renderLink)}
        </ErrorBlock>
      );

    case "footer":
      return (
        <Footer
          key={index}
          label={block.label}
          content={block.content}
          links={block.links}
          chips={block.chips}
          renderLink={renderLink}
          data-rebar-placement-block="footer"
          data-rebar-block-path={path}
        />
      );

    case "scatter-chart":
      return <ScatterChartBlockView key={index} block={block} index={index} path={path} data={data} />;

    case "line-chart":
      return <LineChartBlockView key={index} block={block} index={index} path={path} data={data} />;

    case "stacked-bar-chart":
      return <StackedBarChartBlockView key={index} block={block} index={index} path={path} data={data} />;

    case "stats-table":
      return <StatsTableBlockView key={index} block={block} index={index} path={path} />;

    case "gallery":
      return <GalleryBlockView key={index} block={block} index={index} path={path} />;

    case "construct-entry":
      return (
        <Box
          data-rebar-placement-block="construct-entry"
          data-rebar-block-path={path}
          style={{
            border: "1px solid var(--rebar-color-border, #e0e0e0)",
            borderRadius: "var(--rebar-radius-md, 8px)",
            padding: "var(--rebar-space-lg, 24px)",
            backgroundColor: "var(--rebar-color-bg-surface, #fafafa)",
          }}
        >
          <Stack gap="md">
            <Stack direction="row" gap="sm" align="center">
              <Heading level={3}>{block.id}</Heading>
              <Tag tone={block.measured ? "success" : "default"}>
                {block.measured ? "Measured" : "Unmeasured"}
              </Tag>
            </Stack>
            <Text>{block.description}</Text>
            <Stack gap="sm">
              <Text style={{ fontWeight: 600, fontSize: "var(--rebar-font-size-sm, 14px)" }}>
                Shape
              </Text>
              <CodeBlock code={block.shape} language="typescript" />
            </Stack>
            {block.code && (
              <Stack gap="sm">
                <Text style={{ fontWeight: 600, fontSize: "var(--rebar-font-size-sm, 14px)" }}>
                  Implementation
                </Text>
                <CodeBlock code={block.code} language="typescript" />
              </Stack>
            )}
            {block.blocks && block.blocks.length > 0 && (
              <Stack gap="sm">
                <Text style={{ fontWeight: 600, fontSize: "var(--rebar-font-size-sm, 14px)" }}>
                  Demo
                </Text>
                <Box
                  style={{
                    border: "1px solid var(--rebar-color-border, #e0e0e0)",
                    borderRadius: "var(--rebar-radius-sm, 4px)",
                    padding: "var(--rebar-space-md, 16px)",
                    backgroundColor: "var(--rebar-color-bg, #ffffff)",
                  }}
                >
                  <Stack gap="md">
                    {block.blocks.map((b, i) =>
                      renderBlock(b, i, renderLink, `${path}.blocks`, pageSections, data, handlers)
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Stack>
        </Box>
      );

    case "mega-menu": {
      const columnCount = block.columns.length;
      return (
        <Box
          data-rebar-placement-block="mega-menu"
          data-rebar-block-path={path}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gap: "var(--rebar-space-xl, 32px)",
            padding: "var(--rebar-space-xl, 32px)",
            minWidth: columnCount * 200,
          }}
        >
          {block.columns.map((col, ci) => (
            <Stack key={ci} gap="sm">
              <Text
                as="span"
                size="xs"
                color="secondary"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: "var(--rebar-font-weight-semibold, 600)",
                }}
              >
                {col.heading}
              </Text>
              <Stack gap="xs">
                {col.items.map((item, ii) => {
                  const Icon = item.icon ? ICONS[item.icon] : null;
                  const content = (
                    <Stack gap="xs">
                      <Stack direction="row" gap="xs" align="center">
                        {Icon ? <Icon /> : null}
                        <Text as="span" size="sm" style={{ fontWeight: "var(--rebar-font-weight-medium, 500)" }}>
                          {item.label}
                          {item.external ? " ↗" : null}
                        </Text>
                      </Stack>
                      {item.description ? (
                        <Text size="xs" color="secondary">
                          {item.description}
                        </Text>
                      ) : null}
                    </Stack>
                  );
                  return (
                    <span key={ii} style={{ display: "block" }}>
                      {renderLink({ href: item.href, children: content })}
                    </span>
                  );
                })}
              </Stack>
            </Stack>
          ))}
          {block.footer ? (
            <Box
              style={{
                gridColumn: `1 / -1`,
                borderTop: "1px solid var(--rebar-color-border, #e0e0e0)",
                paddingTop: "var(--rebar-space-md, 16px)",
                marginTop: "var(--rebar-space-sm, 8px)",
              }}
            >
              {renderLink({ href: block.footer.href, children: <Text size="sm">{block.footer.label} →</Text> })}
            </Box>
          ) : null}
        </Box>
      );
    }

    default:
      return null;
  }
}

export function BlockRenderer({ blocks, renderLink = defaultRenderLink, data = {}, handlers = {} }: BlockRendererProps) {
  // Derived once for any `page-index` block among `blocks` — see that case's comment above and
  // this package's schema.ts doc comment for why a page-index block takes no `sections` prop.
  const pageSections = blocks
    .filter((block): block is Extract<Construct, { type: "doc-section" }> => block.type === "doc-section" && !!block.heading)
    .map((block) => ({ id: slugify(block.heading!), label: block.heading! }));

  // `page-index` renders a real `position: sticky` element, and sticky positioning only works when
  // the element is a *direct* flex item of whatever row layout the calling page places it beside
  // (see schema.ts's doc comment on `comparison`/`page-index`: that surrounding row is deliberately
  // hand-authored page chrome, not something this package decides). The normal `<Box><Stack
  // gap="lg">` wrapper below is harmless for every other block, but for a document that's just one
  // lone `page-index` block, it becomes a single-child flex column whose height collapses to that
  // one child's own height — leaving the sticky nav zero room to actually stick before scrolling
  // away with the page. Skip the wrapper in exactly this case so the real `SectionNav` lands as a
  // direct child of the caller's own row, identical to what hand-authoring it there directly gives.
  //
  // `site-header` gets the same treatment for a different reason: it's a real `<header>` landmark
  // meant to sit at the very top of a page's DOM, not nested two levels inside this package's own
  // generic wrapper — harmless either way (a landmark still works nested in plain divs), but a
  // site-wide chrome element used on literally every route is worth keeping clean rather than
  // padded with wrapper markup that exists only to support documents with more than one block.
  const onlyBlock = blocks.length === 1 ? blocks[0] : undefined;
  if (onlyBlock?.type === "page-index" || onlyBlock?.type === "site-header") {
    return renderBlock(onlyBlock, 0, renderLink, "blocks", pageSections, data, handlers);
  }

  return (
    <Box data-rebar-placement-root>
      <Stack gap="lg">
        {blocks.map((block, index) => renderBlock(block, index, renderLink, "blocks", pageSections, data, handlers))}
      </Stack>
    </Box>
  );
}
