import { useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Select } from "./Select";
import { Steps } from "./Steps";
import type { StepItem } from "./Steps";
import { Stack } from "./Stack";

/** Above this step count, `Steps` would otherwise render one item per step no matter how many
 * there are — fine for a handful, unreadable for a long wizard. Caps the visible window at the
 * current step plus the next one, bucketing everything else into a leading "N Done"/trailing
 * "N todo" counter item instead of a real step, so the header stays a fixed, scannable width
 * regardless of total step count. */
const OVERFLOW_THRESHOLD = 3;

function windowSteps(steps: WizardStep[], current: number): { items: StepItem[]; current: number } {
  const total = steps.length;
  if (total <= OVERFLOW_THRESHOLD) {
    return { items: steps.map((s) => ({ title: s.label, description: s.description })), current };
  }

  const windowIndices = [current];
  if (current + 1 < total) windowIndices.push(current + 1);

  const doneCount = current;
  const todoCount = total - windowIndices.length - doneCount;

  const items: StepItem[] = [];
  if (doneCount > 0) {
    items.push({ title: `${doneCount} Done`, status: "finish" });
  }
  for (const i of windowIndices) {
    items.push({
      title: steps[i]!.label,
      description: steps[i]!.description,
      status: i < current ? "finish" : i === current ? "process" : "wait",
      icon: i + 1,
    });
  }
  if (todoCount > 0) {
    items.push({ title: `${todoCount} todo`, status: "wait", icon: "⋯" });
  }

  return { items, current: doneCount > 0 ? 1 : 0 };
}

export interface WizardFieldBase {
  label: string;
  /** Shown before the user ever focuses the field (ref/HEURISTICS.md #26) — gates the step's
   * Next/Submit button until filled, not just a visual hint. */
  required?: boolean;
}

export type WizardField =
  | (WizardFieldBase & { kind: "text" | "email" | "date"; placeholder?: string })
  | (WizardFieldBase & { kind: "textarea"; placeholder?: string })
  | (WizardFieldBase & { kind: "select"; options: string[] })
  | (WizardFieldBase & { kind: "checkbox" });

export interface WizardStep {
  label: string;
  description?: string;
  fields: WizardField[];
}

export type WizardValue = string | boolean;

export interface WizardProps extends Omit<ComponentPropsWithoutRef<"div">, "onSubmit"> {
  steps: WizardStep[];
  submitLabel?: string;
  backLabel?: string;
  nextLabel?: string;
  onSubmit?: (values: Record<string, WizardValue>) => void;
}

/** `Text`'s polymorphic `as` prop doesn't widen its prop types to the target element, so it can't
 * accept `htmlFor` when rendered `as="label"` — a real native `<label>`, styled to match, instead. */
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="rebar-text" data-rebar-size="sm">
      {children}
    </label>
  );
}

function isFilled(value: WizardValue | undefined, field: WizardField): boolean {
  if (!field.required) return true;
  if (field.kind === "checkbox") return value === true;
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * A multi-step form container — `Steps` for progress, one step's fields shown at a time, a
 * Back/Next/Submit footer. The one behavioral requirement that motivated building this rather
 * than composing `Steps` + `Form` by hand each time (see ref/HEURISTICS.md's note on JFace's
 * wizard pattern): a step doesn't advance past its own required fields being empty — Next/Submit
 * is disabled, not just visually hinted, until they're filled. Catalogued as "Wizard" — real risk
 * flagged at catalogue time that this is just Steps + Form composed together, which is exactly
 * why it's a block (`wizard` in `@rebar-ui/placement`) wrapping this real component, not a new
 * bespoke primitive with its own state model invented from scratch. Beyond
 * {@link OVERFLOW_THRESHOLD} steps, the header stops rendering one item per step and instead
 * windows to the current step plus the next one, with a leading "N Done"/trailing "N todo" bucket
 * standing in for everything else — see `windowSteps` above.
 */
export function Wizard({
  steps,
  submitLabel = "Submit",
  backLabel = "Back",
  nextLabel = "Next",
  onSubmit,
  className,
  ...props
}: WizardProps) {
  const [current, setCurrent] = useState(0);
  const [values, setValues] = useState<Record<string, WizardValue>>({});

  const step = steps[current];
  const isLastStep = current === steps.length - 1;

  const setValue = (key: string, value: WizardValue) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canAdvance = step?.fields.every((field, i) => isFilled(values[`${current}-${i}`], field)) ?? true;

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLastStep) {
      onSubmit?.(values);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (!step) return null;

  return (
    <div
      className={clsx("rebar-wizard", className)}
      data-rebar-component="wizard"
      data-rebar-state={isLastStep ? "last-step" : "in-progress"}
      {...props}
    >
      <Steps {...windowSteps(steps, current)} />
      <Stack gap="md" className="rebar-wizard-step" data-rebar-part="step">
        {step.fields.map((field, i) => {
          const key = `${current}-${i}`;
          const value = values[key];
          if (field.kind === "checkbox") {
            return (
              <Checkbox
                key={key}
                checked={value === true}
                onCheckedChange={(checked) => setValue(key, checked === true)}
                data-rebar-part="field"
              >
                {field.label}
                {field.required ? " *" : ""}
              </Checkbox>
            );
          }
          if (field.kind === "select") {
            return (
              <Stack key={key} gap="xs" data-rebar-part="field">
                <FieldLabel>
                  {field.label}
                  {field.required ? " *" : ""}
                </FieldLabel>
                <Select
                  aria-label={field.label}
                  options={field.options.map((o) => ({ value: o, label: o }))}
                  value={typeof value === "string" ? value : undefined}
                  onValueChange={(v) => setValue(key, v)}
                />
              </Stack>
            );
          }
          if (field.kind === "textarea") {
            const fieldId = `rebar-wizard-field-${key}`;
            return (
              <Stack key={key} gap="xs" data-rebar-part="field">
                <FieldLabel htmlFor={fieldId}>
                  {field.label}
                  {field.required ? " *" : ""}
                </FieldLabel>
                <textarea
                  id={fieldId}
                  className="rebar-input"
                  placeholder={field.placeholder}
                  rows={3}
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => setValue(key, e.target.value)}
                />
              </Stack>
            );
          }
          const fieldId = `rebar-wizard-field-${key}`;
          return (
            <Stack key={key} gap="xs" data-rebar-part="field">
              <FieldLabel htmlFor={fieldId}>
                {field.label}
                {field.required ? " *" : ""}
              </FieldLabel>
              <Input
                id={fieldId}
                type={field.kind}
                placeholder={field.placeholder}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setValue(key, e.target.value)}
              />
            </Stack>
          );
        })}
      </Stack>
      <Stack direction="row" gap="sm" justify="between" className="rebar-wizard-footer" data-rebar-part="footer">
        {current > 0 ? (
          <Button variant="secondary" onClick={() => setCurrent((c) => c - 1)}>
            {backLabel}
          </Button>
        ) : (
          <span />
        )}
        <Button variant="primary" onClick={handleNext} disabled={!canAdvance}>
          {isLastStep ? submitLabel : nextLabel}
        </Button>
      </Stack>
    </div>
  );
}
