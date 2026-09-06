import { forwardRef } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

export type TabsProps = ComponentPropsWithoutRef<typeof RadixTabs.Root>;

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { className, ...props },
  ref,
) {
  return (
    <RadixTabs.Root
      ref={ref}
      className={clsx("rebar-tabs", className)}
      data-rebar-component="tabs"
      {...props}
    />
  );
});

export type TabListProps = ComponentPropsWithoutRef<typeof RadixTabs.List>;

export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, ...props },
  ref,
) {
  return (
    <RadixTabs.List
      ref={ref}
      className={clsx("rebar-tab-list", className)}
      data-rebar-part="list"
      {...props}
    />
  );
});

export type TabProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger> & {
  /** Force bionic reading on/off for the tab label, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
};

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { className, children, bionic, bionicOptions, ...props },
  ref,
) {
  const label = useBionicChildren(children, bionic, bionicOptions);
  return (
    <RadixTabs.Trigger
      ref={ref}
      className={clsx("rebar-tab", className)}
      data-rebar-part="tab"
      {...props}
    >
      {label}
    </RadixTabs.Trigger>
  );
});

export type TabPanelProps = ComponentPropsWithoutRef<typeof RadixTabs.Content>;

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { className, ...props },
  ref,
) {
  return (
    <RadixTabs.Content
      ref={ref}
      className={clsx("rebar-tab-panel", className)}
      data-rebar-part="panel"
      {...props}
    />
  );
});
