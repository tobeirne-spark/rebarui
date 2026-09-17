import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tab, TabList, TabPanel, Tabs } from "../components/Tabs";

function Sample() {
  return (
    <Tabs defaultValue="overview">
      <TabList aria-label="Sections">
        <Tab value="overview">Overview</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanel value="overview">Overview content</TabPanel>
      <TabPanel value="settings">Settings content</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("exposes standard tablist/tab/tabpanel roles", () => {
    render(<Sample />);
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview content");
  });

  it("marks the active tab via data-state, matching Radix's own convention", () => {
    render(<Sample />);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("switches panels with arrow-key keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<Sample />);

    await user.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Settings content");
  });

  it("size='jumbo' on TabList tags data-rebar-size, and a Tab's description renders and is included in its accessible name", () => {
    render(
      <Tabs defaultValue="overview">
        <TabList aria-label="Sections" size="jumbo">
          <Tab value="overview" description="See the big picture">
            Overview
          </Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>
        <TabPanel value="overview">Overview content</TabPanel>
        <TabPanel value="settings">Settings content</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("data-rebar-size", "jumbo");
    expect(screen.getByText("See the big picture")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview See the big picture" })).toBeInTheDocument();
    // A Tab with no description renders none at all — no empty element, no layout change.
    const settingsTab = screen.getByRole("tab", { name: "Settings" });
    expect(settingsTab.querySelector(".rebar-tab-description")).not.toBeInTheDocument();
  });

  it("default TabList has no data-rebar-size='jumbo' and Tab renders its label normally without description", () => {
    render(<Sample />);
    expect(screen.getByRole("tablist")).toHaveAttribute("data-rebar-size", "default");
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
  });
});
