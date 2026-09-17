import { forwardRef } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
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

export type TabListProps = ComponentPropsWithoutRef<typeof RadixTabs.List> & {
  /**
   * `"jumbo"` renders larger, more prominent tab buttons (bigger label, room for each `Tab`'s own
   * `description`) — antd-mobile's `JumboTabs` shape, ported as a `TabList` size rather than a
   * second component, since `JumboTabs`'s own docs describe it as "very similar to Tabs" with no
   * behavior difference beyond the bigger, description-carrying tab buttons. Default `"default"`.
   */
  size?: "default" | "jumbo";
};

export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, size = "default", ...props },
  ref,
) {
  return (
    <RadixTabs.List
      ref={ref}
      className={clsx("rebar-tab-list", className)}
      data-rebar-part="list"
      data-rebar-size={size}
      {...props}
    />
  );
});

export type TabProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger> & {
  /** Force bionic reading on/off for the tab label, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
  /** A second line under the label — only meaningful inside a `size="jumbo"` `TabList`, but not
   * gated on it: renders regardless, so a caller composing its own layout can still use it. */
  description?: ReactNode;
};

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { className, children, bionic, bionicOptions, description, ...props },
  ref,
) {
  const label = useBionicChildren(children, bionic, bionicOptions);
  const descriptionContent = useBionicChildren(description, bionic, bionicOptions);
  return (
    <RadixTabs.Trigger
      ref={ref}
      className={clsx("rebar-tab", className)}
      data-rebar-part="tab"
      {...props}
    >
      <span className="rebar-tab-label" data-rebar-part="tab-label">
        {label}
      </span>
      {description ? (
        <span className="rebar-tab-description" data-rebar-part="tab-description">
          {descriptionContent}
        </span>
      ) : null}
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
