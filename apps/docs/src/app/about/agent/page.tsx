import { Heading, Image, Stack, Text, CodeBlock } from "rebar-ui";
import fs from "fs/promises";
import path from "path";

export default async function AgentPage() {
  const agentMd = await fs.readFile(
    path.join(process.cwd(), "public/agent.md"),
    "utf-8"
  );

  return (
    <Stack gap="lg" style={{ maxWidth: 800, margin: "0 auto", padding: "var(--rebar-space-xl)" }}>
      <Image src="/catalogue-heros/designbot.jpeg" alt="Agent context hero" style={{ width: "100%", borderRadius: "8px" }} />
      <Heading level={1}>Agent Context</Heading>
      <Text color="secondary">
        The full design-heuristics checklist and framework rules for building with Rebar UI —
        everything an AI agent needs to understand the Four-Tier Typology, the distinction between
        Framework Rules (fixed, mechanical constraints) and Heuristics (judgment-requiring design
        principles), and the 46-item checklist that governs component and construct design. Paste
        it into an agent&apos;s system prompt or project context before asking it to extend this
        framework or build new components.
      </Text>
      <Text color="secondary">
        Raw file: <a href="/agent.md" className="rebar-link">/agent.md</a>
      </Text>
      <CodeBlock code={agentMd} />
    </Stack>
  );
}
