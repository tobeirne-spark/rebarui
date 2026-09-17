import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A multi-step form container — Steps for progress, one step's fields shown at a time, a Back/Next/Submit footer. Next/Submit is disabled until the current step's required fields are filled, not just visually hinted (see the JFace wizard note in ref/HEURISTICS.md). Wraps the real Wizard component (packages/core) rather than inventing a new state model in this package — catalogued as a real risk that this is just Steps + Form composed together, which is exactly why it's a block, not a bespoke primitive." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "wizard", steps: { label: string, description?: string, fields: FormField[] }[], submitLabel?: string, backLabel?: string, nextLabel?: string }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the wizard block:" }],
  },
  {
      type: "wizard",
      steps: [
        {
          label: "Team",
          fields: [
            {
              kind: "text",
              label: "Team name",
              required: true,
            },
          ],
        },
        {
          label: "Details",
          fields: [
            {
              kind: "textarea",
              label: "Notes",
            },
          ],
        },
      ],
    },
];

export default function WizardPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Wizard</Heading>
      <Text color="secondary">{"A multi-step form container — Steps for progress, one step's fields shown at a time, a Back/Next/Submit footer. Next/Submit is disabled until the current step's required fields are filled, not just visually hinted (see the JFace wizard note in ref/HEURISTICS.md). Wraps the real Wizard component (packages/core) rather than inventing a new state model in this package — catalogued as a real risk that this is just Steps + Form composed together, which is exactly why it's a block, not a bespoke primitive."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
