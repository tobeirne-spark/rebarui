"use client";

import { useState } from "react";
import { AiChatInput, Box, ChatThread, Heading, Stack, Text } from "rebar-ui";
import type { AiChatInputIntent, ChatMessage } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { LivePreview } from "@/components/LivePreview";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<AiChatInput value={draft} onValueChange={setDraft} onSend={sendMessage} dictation dictating={isDictating} onDictationToggle={setIsDictating} intent={inferredIntent} />',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["AiChatInput"] ?? [] },
  {
    type: "doc-section",
    heading: "Distinct from ChatThread, composed alongside it",
    body: [
      {
        kind: "text",
        text: "`ChatThread` renders an existing conversation; it has no compose control of its own. This is the compose half — a multi-line field that grows with its own content, plus a primary action button — specific enough to an LLM-chat interaction shape (dictation, intent-aware sending) to deserve its own component rather than folding into `ChatThread`. The two compose together in whatever surrounding chat layout a caller builds, shown live below.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "intent: real behavior change, not a cosmetic label",
    body: [
      {
        kind: "text",
        text: 'This component does no intent inference itself — that\'s a caller/LLM concern, the same "report intent, caller owns the real operation" convention `FileManager`\'s own `actions` already follows. `intent` (`"message"` | `"command"` | `"search"`, caller-supplied from whatever classification they already have) changes the primary button\'s real icon and label to match: a plain message sends, a detected command runs, a detected search searches — genuinely different affordances, not the same button relabeled for its own sake.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Dictation is a toggle, not a recording engine",
    body: [
      {
        kind: "text",
        text: '`dictation` shows a mic/stop toggle button; `dictating`/`onDictationToggle` are the caller\'s hook to start/stop whatever real speech-to-text they\'re using (the same accepted "caller owns the real work" exception `VoiceComposer`\'s own `state` already documents) — transcribed text then flows back through the ordinary `value`/`onValueChange`, the ordinary way any typed text does.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="ai-chat-input"`, `data-rebar-intent`; parts: `textarea`, `actions`, `dictation-button` (carries `data-rebar-active` while dictating), `send-button`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no dedicated AI-chat input of its own; a migration typically composes AntD's plain `Input.TextArea` (autoSize) with a custom send button, or reaches for Ant Design X's own chat components if that package is already in use.",
      },
    ],
  },
];

let messageId = 0;
function nextId() {
  messageId += 1;
  return `m${messageId}`;
}

export default function AiChatInputPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: "assistant", content: "Ask me anything, or type / for a command." },
  ]);
  const [draft, setDraft] = useState("");
  const [dictating, setDictating] = useState(false);
  const intent: AiChatInputIntent = draft.trim().startsWith("/") ? "command" : draft.trim().startsWith("?") ? "search" : "message";

  const handleSend = (text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: text }]);
    setDraft("");
  };

  return (
    <Stack gap="lg">
      <Heading level={1}>AiChatInput</Heading>
      <Text color="secondary">
        A chat message composer — a growing multi-line field, an intent-aware primary button, and
        an optional dictation toggle.
      </Text>

      <Stack gap="xs">
        <Text size="sm" color="secondary">
          Composed with ChatThread — type a plain message, or start with <code>/</code> (command)
          or <code>?</code> (search) to see the button change
        </Text>
        <Box style={{ border: "1px solid var(--rebar-color-border, #e0e0e0)", borderRadius: 4, padding: "var(--rebar-space-md)" }}>
          <Stack gap="sm">
            <div style={{ height: 220, overflowY: "auto" }}>
              <ChatThread messages={messages} />
            </div>
            <AiChatInput
              value={draft}
              onValueChange={setDraft}
              onSend={handleSend}
              intent={intent}
              dictation
              dictating={dictating}
              onDictationToggle={setDictating}
            />
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" gap="lg" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            intent=&quot;command&quot;
          </Text>
          <LivePreview>
            <AiChatInput intent="command" defaultValue="/deploy staging" />
          </LivePreview>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" color="secondary">
            intent=&quot;search&quot;
          </Text>
          <LivePreview>
            <AiChatInput intent="search" defaultValue="pricing docs" />
          </LivePreview>
        </Stack>
      </Stack>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
