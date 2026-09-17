import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A card containing labeled fields (text/email/date/textarea/select/checkbox, each optionally required) and an optional submit button. Omit submitLabel when the form is nested inside a modal, which supplies its own action buttons." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "form", heading?: string, fields: FormField[], submitLabel?: string }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the form block:" }],
  },
  {
      type: "form",
      heading: "Account Settings",
      fields: [
        {
          kind: "text",
          label: "Display name",
          placeholder: "e.g. Jane Doe",
        },
      ],
      submitLabel: "Save changes",
    },
];

export default function FormPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Form</Heading>
      <Text color="secondary">{"A card containing labeled fields (text/email/date/textarea/select/checkbox, each optionally required) and an optional submit button. Omit submitLabel when the form is nested inside a modal, which supplies its own action buttons."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
