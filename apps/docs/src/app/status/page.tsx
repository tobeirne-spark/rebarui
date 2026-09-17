"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  Form,
  FormItem,
  Heading,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from "rebar-ui";

const PHASES = [
  { label: "Phase 1 — core primitives (Box, Stack, Text, Heading, Button, Input, Card, Alert)", done: true },
  { label: "Phase 2 — composite components (Dialog, Tabs, Form)", done: true },
  { label: "Phase 3 — theming (sketch, clean, dark)", done: true },
  { label: "Phase 4 — DevTools panel — click 🔧 bottom-right", done: true },
  { label: "Phase 5 — migration tooling (@rebar-ui/migrate-antd + MIGRATION_PROMPT.md)", done: true },
  { label: "Phase 6 — this site, for real — you're looking at part of it", done: true },
];

export default function StatusPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  // This page forces data-rebar-theme="sketch" (below), but dark mode is a separate attribute
  // toggled globally by DevTools on <html> — mirroring it here too is required, since the theme
  // stylesheets' dark overrides are compound selectors (e.g.
  // [data-rebar-theme="sketch"][data-theme="dark"]) that only match when both attributes sit on
  // the same element.
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      as="main"
      data-rebar-theme="sketch"
      data-theme={dark ? "dark" : undefined}
      style={{ maxWidth: 720, margin: "0 auto", padding: "var(--rebar-space-xl)" }}
    >
      <Stack gap="lg">
        <Stack gap="xs">
          <Heading level={1}>Build status</Heading>
          <Text color="secondary">
            Internal workbench, not the public homepage (see <code>/</code> for that) — every
            component rendered together in sketch mode, for a quick sanity check while building.
          </Text>
        </Stack>

        <Alert type="info" title="Not part of the public docs nav">
          Kept around because it&apos;s a useful at-a-glance check, but it&apos;s not linked from
          the site header — the real per-component reference lives under the four tier catalogs
          (/imitations, /synthetics, /opinions, /orders).
        </Alert>

        <Card>
          <Stack gap="md">
            <Heading level={3}>Live component check</Heading>

            <Stack direction="row" gap="sm">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="destructive">Destructive</Button>
            </Stack>

            <Stack direction="row" gap="sm">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
            </Stack>

            <Form<{ email: string }> onSubmit={(values) => setSubmittedEmail(values.email)}>
              <FormItem name="email" label="Email" required>
                {(field) => <Input type="email" placeholder="you@example.com" {...field} />}
              </FormItem>
              <Stack direction="row" gap="sm">
                <Button type="submit" variant="primary">
                  Submit
                </Button>
                {submittedEmail ? (
                  <Text size="sm" color="secondary">
                    Submitted: {submittedEmail}
                  </Text>
                ) : null}
              </Stack>
            </Form>
          </Stack>
        </Card>

        <Card>
          <Stack gap="md">
            <Heading level={3}>Dialog + Tabs</Heading>

            <Dialog
              trigger={<Button variant="destructive">Delete account</Button>}
              title="Delete account"
              description="This cannot be undone."
              footer={
                <>
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </>
              }
            >
              <Text size="sm">
                All of your data will be permanently removed. Type DELETE to confirm.
              </Text>
            </Dialog>

            <Tabs defaultValue="overview">
              <TabList aria-label="Demo sections">
                <Tab value="overview">Overview</Tab>
                <Tab value="settings">Settings</Tab>
              </TabList>
              <TabPanel value="overview">
                <Text size="sm">Overview panel content.</Text>
              </TabPanel>
              <TabPanel value="settings">
                <Text size="sm">Settings panel content.</Text>
              </TabPanel>
            </Tabs>
          </Stack>
        </Card>

        <Stack gap="xs">
          <Heading level={2}>Build progress</Heading>
          {PHASES.map((phase) => (
            <Text key={phase.label} size="sm" color={phase.done ? "primary" : "secondary"}>
              {phase.done ? "✅" : "⬜"} {phase.label}
            </Text>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
