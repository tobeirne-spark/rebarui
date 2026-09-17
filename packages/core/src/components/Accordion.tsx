import { forwardRef } from "react";
import * as RadixAccordion from "@radix-ui/react-accordion";
import type { ReactNode } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "./icons";

export type AccordionProps =
  | ({ type: "single" } & RadixAccordion.AccordionSingleProps)
  | ({ type: "multiple" } & RadixAccordion.AccordionMultipleProps);

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { className, ...props },
  ref,
) {
  return (
    <RadixAccordion.Root
      ref={ref}
      className={clsx("rebar-accordion", className)}
      data-rebar-component="accordion"
      {...props}
    />
  );
});

export interface AccordionItemProps {
  value: string;
  trigger: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

export function AccordionItem({ value, trigger, children, disabled }: AccordionItemProps) {
  return (
    <RadixAccordion.Item
      value={value}
      disabled={disabled}
      className="rebar-accordion-item"
      data-rebar-part="item"
    >
      <RadixAccordion.Header className="rebar-accordion-header">
        <RadixAccordion.Trigger className="rebar-accordion-trigger" data-rebar-part="trigger">
          {trigger}
          <span className="rebar-accordion-icon" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      <RadixAccordion.Content className="rebar-accordion-content" data-rebar-part="content">
        {children}
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  );
}
