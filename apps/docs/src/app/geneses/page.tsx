import { Heading, Image, Stack, Text } from "rebar-ui";

export default function GenesesPage() {
  return (
    <Stack gap="lg">
      <Image src="/catalogue-heros/genses.jpeg" alt="Geneses hero image" style={{ width: "100%", borderRadius: "8px" }} />
      <Heading level={1}>Geneses</Heading>
      <Text color="secondary">
        Seed projects grounded in the Rebar UI framework — complete, production-ready applications
        that demonstrate the full construct-based approach in action. Each genesis is a well-architected
        starting point you can clone, customize, and build upon.
      </Text>
      <Text color="secondary">
        Geneses serve as both learning resources and foundations for your own projects. They show how
        to compose constructs into real applications, how to structure a project around the Packer,
        and how to extend the framework with project-specific constructs when the shipped catalog
        doesn&apos;t quite fit.
      </Text>
      <Heading level={2}>Coming soon</Heading>
      <Text color="secondary">
        The first genesis projects are being prepared. Check back soon for seed applications spanning
        dashboards, admin panels, content sites, and more — each built entirely from constructs, each
        ready to fork and make your own.
      </Text>
    </Stack>
  );
}
