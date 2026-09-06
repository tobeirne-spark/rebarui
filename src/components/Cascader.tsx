import { useState } from "react";
import clsx from "clsx";
import { Select } from "./Select";

export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
}

export interface CascaderProps {
  options: CascaderOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (path: string[], labels: string[]) => void;
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Multi-level cascading select (province → city → district) — one real `Select` per level, each
 * level's options are the previous level's chosen option's `children`. Choosing a new value at
 * any level clears every level after it, since those choices no longer apply to the new branch.
 */
export function Cascader({
  options,
  value,
  defaultValue = [],
  onValueChange,
  placeholder,
  "aria-label": ariaLabel,
  disabled,
  className,
}: CascaderProps) {
  const [internalPath, setInternalPath] = useState<string[]>(defaultValue);
  const isControlled = value !== undefined;
  const path = isControlled ? value : internalPath;

  const levels: { options: CascaderOption[]; selected?: string }[] = [];
  let currentOptions = options;
  for (let i = 0; i <= path.length && currentOptions.length > 0; i++) {
    const selected = path[i];
    levels.push({ options: currentOptions, selected });
    if (selected === undefined) break;
    const chosen = currentOptions.find((o) => o.value === selected);
    if (!chosen?.children?.length) break;
    currentOptions = chosen.children;
  }

  const selectAt = (levelIndex: number, newValue: string) => {
    const nextPath = [...path.slice(0, levelIndex), newValue];
    if (!isControlled) setInternalPath(nextPath);
    const labels: string[] = [];
    let opts = options;
    for (const v of nextPath) {
      const found = opts.find((o) => o.value === v);
      if (!found) break;
      labels.push(found.label);
      opts = found.children ?? [];
    }
    onValueChange?.(nextPath, labels);
  };

  return (
    <div className={clsx("rebar-cascader", className)} data-rebar-component="cascader">
      {levels.map((level, i) => (
        <Select
          key={i}
          aria-label={ariaLabel ? `${ariaLabel}, level ${i + 1}` : `Level ${i + 1}`}
          options={level.options.map((o) => ({ value: o.value, label: o.label }))}
          value={level.selected ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          onValueChange={(v) => selectAt(i, v)}
        />
      ))}
    </div>
  );
}
