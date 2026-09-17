import { Heading, Stack, Text } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Overview",
    body: [{ kind: "text", text: "A chat surface: ChatThread (the transcript) + AiChatInput (the composer) — the exact composition this project's own AiChatInput reference page already hand-authors. Local-only state seeded from the block's literal messages; sending appends the caller's own new message to the transcript, never fabricating an assistant reply, since this is a static-render demo surface, not a real backend. intent is computed from the current draft text (/ for command, ? for search), not a block-level setting, since it's about what's currently typed." }],
  },
  {
    type: "doc-section",
    heading: "Shape",
    body: [{ kind: "code", code: `{ type: "ai-chat", title?: string, messages: AiChatMessageData[], placeholder?: string, dictation?: boolean, height?: number }
// AiChatMessageData = { id: string, role: "user" | "assistant", content: string, avatarFallback?: string, avatarSrc?: string, avatarPlaceholder?: boolean }` }],
  },
  {
    type: "doc-section",
    heading: "Example",
    body: [{ kind: "text", text: "A live example of the ai-chat block:" }],
  },
  {
      type: "ai-chat",
      title: "Support chat",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "How can I help today?",
          avatarFallback: "AI",
        },
        {
          id: "2",
          role: "user",
          content: "My order hasn't arrived yet.",
          avatarFallback: "JD",
        },
      ],
    },
];

export default function AiChatPage() {
  return (
    <Stack gap="lg">
      <Heading level={1}>Ai Chat</Heading>
      <Text color="secondary">{"A chat surface: ChatThread (the transcript) + AiChatInput (the composer) — the exact composition this project's own AiChatInput reference page already hand-authors. Local-only state seeded from the block's literal messages; sending appends the caller's own new message to the transcript, never fabricating an assistant reply, since this is a static-render demo surface, not a real backend. intent is computed from the current draft text (/ for command, ? for search), not a block-level setting, since it's about what's currently typed."}</Text>
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
