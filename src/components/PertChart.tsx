import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { NodeLinkGraph } from "./NodeLinkGraph";
import type { NodeLinkGraphEdge, NodeLinkGraphNode } from "./NodeLinkGraph";
import { renderBionicSvgText, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface PertTask {
  id: string;
  label: string;
  /** Task duration, in whatever unit the caller's own schedule uses (days are typical) — this
   * component doesn't interpret the unit, only does arithmetic on it. */
  duration: number;
  /** Ids of tasks that must complete before this one starts. A dangling id (no matching task) is
   * silently skipped rather than throwing — the same tolerance `GanttChart`'s own `dependsOn`
   * already has, for a caller mid-edit of a task list. */
  dependsOn?: string[];
}

export interface PertChartProps extends Omit<ComponentPropsWithoutRef<"figure">, "title"> {
  tasks: PertTask[];
  /** Rendered as a real, visible caption above the diagram — see ref/HEURISTICS.md #16. */
  title?: string;
  /** Falls back to `title` when omitted — the diagram's own accessible name. */
  ariaLabel?: string;
  width?: number;
  height?: number;
  padding?: number;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

interface ComputedTask extends PertTask {
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  critical: boolean;
}

/**
 * Computes the standard forward/backward CPM (critical path method) pass over a dependency graph
 * — earliest start/finish via a forward pass from tasks with no dependencies, latest start/finish
 * via a backward pass from the project's own end, slack = latestStart - earliestStart, and a task
 * is on the critical path when its slack is (as close to) zero (as floating-point arithmetic gets —
 * see the `EPSILON` comment below). A cyclic `dependsOn` graph (a real caller data-entry mistake,
 * not a case this tries to detect/report) would make the forward pass never converge for the
 * involved tasks; those tasks simply keep their initial `0` earliest-start/finish rather than the
 * component looping forever, since each task's own forward computation only ever reads already-
 * resolved dependency values in topological order — a cycle means at least one task's dependency
 * never resolves, so it's silently left at its safe initial value instead.
 */
function computeCpm(tasks: PertTask[]): ComputedTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();

  // Forward pass, in the caller's own array order — correct for any dependency-respecting order
  // (a task's dependencies must already have real values once every earlier task's own dependency
  // ids are themselves earlier in this same array), the common case for hand-authored task lists;
  // see the doc comment above for what happens on a genuine out-of-order/cyclic dependency.
  for (const task of tasks) {
    const validDeps = (task.dependsOn ?? []).filter((id) => byId.has(id));
    const es = validDeps.length === 0 ? 0 : Math.max(...validDeps.map((id) => earliestFinish.get(id) ?? 0));
    earliestStart.set(task.id, es);
    earliestFinish.set(task.id, es + task.duration);
  }

  const projectEnd = Math.max(...tasks.map((t) => earliestFinish.get(t.id) ?? 0), 0);

  const dependents = new Map<string, string[]>();
  for (const task of tasks) {
    for (const depId of task.dependsOn ?? []) {
      if (!byId.has(depId)) continue;
      const list = dependents.get(depId) ?? [];
      list.push(task.id);
      dependents.set(depId, list);
    }
  }

  const latestFinish = new Map<string, number>();
  const latestStart = new Map<string, number>();
  // Backward pass, in reverse array order — the mirror of the forward pass's own ordering
  // assumption.
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i]!;
    const dependentIds = dependents.get(task.id) ?? [];
    const lf = dependentIds.length === 0 ? projectEnd : Math.min(...dependentIds.map((id) => latestStart.get(id) ?? projectEnd));
    latestFinish.set(task.id, lf);
    latestStart.set(task.id, lf - task.duration);
  }

  // Floating-point slack arithmetic can land a hair off zero for a task that's really on the
  // critical path (e.g. 0.00000000000001 from repeated subtraction) — treated as critical anyway,
  // rather than a strict `=== 0` silently dropping a real critical-path task over a rounding error.
  const EPSILON = 1e-6;

  return tasks.map((task) => {
    const es = earliestStart.get(task.id) ?? 0;
    const ef = earliestFinish.get(task.id) ?? 0;
    const ls = latestStart.get(task.id) ?? 0;
    const lf = latestFinish.get(task.id) ?? 0;
    const slack = ls - es;
    return { ...task, earliestStart: es, earliestFinish: ef, latestStart: ls, latestFinish: lf, slack, critical: slack <= EPSILON };
  });
}

const NODE_WIDTH = 150;
const NODE_HEIGHT = 60;

/**
 * A PERT (Program Evaluation Review Technique) network diagram — tasks as nodes carrying their own
 * computed early/late start/finish and slack, connected by dependency edges, with the critical path
 * (zero-slack tasks) highlighted. Deliberately not baseline-tracking project-management tooling: no
 * separate "baseline" object to maintain and diff against — pair with `WaybackSlider` instead,
 * feeding this component a whole historical snapshot of `tasks` per reporting date and scrubbing
 * through real past reports directly.
 */
export function PertChart({
  tasks,
  title,
  ariaLabel,
  width = 560,
  height = 380,
  padding,
  bionic,
  bionicOptions,
  className,
  ...props
}: PertChartProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;

  const computed = useMemo(() => computeCpm(tasks), [tasks]);
  const computedById = useMemo(() => new Map(computed.map((t) => [t.id, t])), [computed]);

  const nodes = useMemo<NodeLinkGraphNode[]>(() => {
    // A synthetic single root when more than one task has no real dependency, so `NodeLinkGraph`'s
    // hierarchical layout has one real starting point to lay out from — the same reasoning
    // `MindMap` already uses its own synthetic root for.
    return tasks.map((t) => ({ id: t.id, label: t.label, parentId: t.dependsOn?.find((id) => tasks.some((x) => x.id === id)) }));
  }, [tasks]);

  const edges = useMemo<NodeLinkGraphEdge[]>(
    () =>
      tasks.flatMap((t) =>
        (t.dependsOn ?? [])
          .filter((depId) => tasks.some((x) => x.id === depId))
          .map((depId) => ({ source: depId, target: t.id })),
      ),
    [tasks],
  );

  return (
    <NodeLinkGraph
      className={clsx("rebar-pert-chart", className)}
      data-rebar-component="pert-chart"
      nodes={nodes}
      edges={edges}
      layout="hierarchical"
      title={title}
      ariaLabel={ariaLabel ?? title ?? "PERT chart"}
      width={width}
      height={height}
      padding={padding}
      renderEdgeStyle={(edge) => {
        const from = computedById.get(edge.source);
        const to = computedById.get(edge.target);
        if (from?.critical && to?.critical) {
          return { stroke: "var(--rebar-color-danger, #d32f2f)", strokeWidth: 3 };
        }
        return undefined;
      }}
      renderNode={(node) => {
        const task = computedById.get(node.id);
        if (!task) return null;
        const isCritical = task.critical;
        const fill = isCritical ? "var(--rebar-color-danger, #d32f2f)" : "var(--rebar-color-primary, #0066cc)";
        return (
          <>
            <rect
              x={-NODE_WIDTH / 2}
              y={-NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={6}
              fill="var(--rebar-color-bg-primary, #ffffff)"
              stroke={fill}
              strokeWidth={isCritical ? 2.5 : 1.5}
              data-rebar-part={isCritical ? "critical-node" : "node-box"}
            />
            <text textAnchor="middle" y={-14} fontSize={12} fill="var(--rebar-color-text-primary, #212121)" style={{ fontWeight: 600 }}>
              {renderBionicSvgText(task.label, bionicEnabled, bionicOptions)}
            </text>
            <text textAnchor="middle" y={2} fontSize={10} fill="var(--rebar-color-text-secondary, #757575)">
              {`ES ${task.earliestStart} · EF ${task.earliestFinish}`}
            </text>
            <text textAnchor="middle" y={16} fontSize={10} fill="var(--rebar-color-text-secondary, #757575)">
              {`LS ${task.latestStart} · LF ${task.latestFinish}`}
            </text>
            <text textAnchor="middle" y={30} fontSize={10} fill={fill} style={{ fontWeight: 600 }}>
              {isCritical ? "Critical · 0 slack" : `Slack ${task.slack}`}
            </text>
          </>
        );
      }}
      {...props}
    />
  );
}
