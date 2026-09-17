"use client";

import { useState } from "react";
import { Editable, Heading, Stack, Text, TodoItem } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

interface Task {
  id: string;
  label: string;
  completed: boolean;
}

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<TodoItem label="Ship the release" completed={done} onToggle={setDone} toggleLabel={`Mark "Ship the release" as ${done ? "incomplete" : "complete"}`} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["TodoItem"] ?? [] },
  {
    type: "doc-section",
    heading: "A row, not a list",
    body: [
      {
        kind: "text",
        text: 'This is one checkable row — a real ≥44×44 `<button role="checkbox">` toggle plus a label slot — not a list container. `label` accepts any `ReactNode`, so an inline-editable name (an `Editable`, as in the second example below) composes directly, the same way `Card`\'s slot props accept arbitrary content rather than a fixed string. The `goal-tracker` [block](/opinions#goal-tracker) is what actually assembles many of these into the full Aspiration → Focus Area → Goal hierarchy `GoalTracker` used to be as a standalone component — see that block for a hierarchical to-do/OKR tracker; reach for `TodoItem` directly when you only need one checkable row inside your own layout.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Celebration is opt-in and respects reduced motion",
    body: [
      {
        kind: "text",
        text: 'The confetti burst only fires when toggling *into* completed (never on un-completing), is skipped entirely under `prefers-reduced-motion` regardless of the `celebration` prop, and has three sizes: `"small"` (default), `"big"`, or `"none"` to disable it.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="todo-item"` on the root; parts: `toggle`, `label`, `burst` (present only while a completion celebration is animating).',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD has no direct equivalent of a celebratory-burst checkbox row; migrating means composing AntD's own `Checkbox` with a custom or third-party confetti effect.",
      },
    ],
  },
];

export default function TodoItemPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", label: "Write the proposal", completed: true },
    { id: "t2", label: "Ship the release", completed: false },
    { id: "t3", label: "Send the recap", completed: false },
  ]);

  const toggle = (id: string, completed: boolean) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed } : task)));
  };

  const rename = (id: string, label: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, label } : task)));
  };

  return (
    <Stack gap="lg">
      <Heading level={1}>TodoItem</Heading>
      <Text color="secondary">
        A checkable row — a large toggle button, a label slot, and an optional celebratory
        confetti burst on completion. The primitive extracted from <code>GoalTracker</code> when
        that hierarchy was reclassified into the <code>goal-tracker</code> block.
      </Text>

      <LivePreview>
        <Stack gap="sm" style={{ maxWidth: 360 }}>
          {tasks.map((task) => (
            <TodoItem
              key={task.id}
              label={
                <Editable
                  value={task.label}
                  onChange={(text) => rename(task.id, text)}
                  aria-label="Task"
                  className={task.completed ? "rebar-todo-item-label-completed" : undefined}
                />
              }
              completed={task.completed}
              onToggle={(completed) => toggle(task.id, completed)}
              toggleLabel={`Mark "${task.label}" as ${task.completed ? "incomplete" : "complete"}`}
            />
          ))}
        </Stack>
      </LivePreview>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
