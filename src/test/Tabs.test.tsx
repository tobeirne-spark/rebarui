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
});
