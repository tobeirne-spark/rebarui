"use client";

import { useRef, useState } from "react";
import { Button, ChatThread, Heading, Stack, Text } from "rebar-ui";
import type { ChatMessage } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const INITIAL: ChatMessage[] = [
  { id: "1", role: "user", content: "Can you summarize this quarter's numbers, and show the query?", status: "sent", avatarFallback: "JD" },
  {
    id: "2",
    role: "assistant",
    content:
      "**Revenue is up 12%** quarter over quarter, driven mostly by the new enterprise tier:\n\n- Enterprise: +18%\n- Self-serve: +4%\n\n```sql\nSELECT sum(revenue) FROM orders WHERE tier = 'enterprise';\n```",
    status: "sent",
    avatarFallback: "AI",
  },
];

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<ChatThread\n  messages={messages}\n  isTyping={isTyping}\n  onRetry={(m) => resend(m.id)}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["ChatThread"] ?? [] },
  {
    type: "doc-section",
    heading: "Presentational — the caller owns streaming",
    body: [
      {
        kind: "text",
        text: "This component performs no networking itself, the same convention `FileUpload` follows for uploads — the caller updates a message's `content` in place as chunks arrive and this re-renders. Only auto-scrolls to new content when the reader is already at the bottom; scrolled-up readers get a floating \"new messages\" button instead of being yanked back down. A per-message `avatarFallback` (plus `avatarSrc`/`avatarPlaceholder`, matching `Avatar`'s own props exactly) renders a real `Avatar` beside the bubble — omitted entirely, no layout change at all, on any message that doesn't set it.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Markdown by default — real LLM responses aren't plain text",
    body: [
      {
        kind: "text",
        text: "`content` renders as styled Markdown by default (headings, lists, blockquotes, inline bold/italic/code/links) — real assistant responses from Claude, Qwen, and most other models default to Markdown prose, so this is the common case, not an opt-in extra. A fenced code block renders as a real, embedded `CodeBlock` — its own copy button and language label included, not a bare `<pre>` — see the assistant message above. Set `markdown={false}` for a transcript that's genuinely plain text, where literal `*`/`#`/backtick characters in the content shouldn't be interpreted as markup.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="chat-thread"`; each message carries `data-rebar-role` and `data-rebar-status`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — AntD ships no chat-transcript component of its own; a migration typically composes `List` + `Avatar` + `Spin` directly, or adopts a dedicated chat-UI library.",
      },
    ],
  },
];

const DEMO_REPLIES = [
  "Got it — anything else you'd like broken down?",
  "New enterprise signups are the biggest driver this quarter.",
  "Churn ticked down slightly too, so retention's trending the right way.",
];

export default function ChatThreadPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL);
  const nextId = useRef(messages.length + 1);
  const nextReply = useRef(0);

  const addMessage = () => {
    const id = String(nextId.current++);
    const lastRole = messages[messages.length - 1]?.role;
    if (lastRole === "assistant" || lastRole === undefined) {
      setMessages((prev) => [
        ...prev,
        { id, role: "user", content: "What's driving that?", status: "sent", avatarFallback: "JD" },
      ]);
    } else {
      const content = DEMO_REPLIES[nextReply.current++ % DEMO_REPLIES.length]!;
      setMessages((prev) => [...prev, { id, role: "assistant", content, status: "sent", avatarFallback: "AI" }]);
    }
  };

  return (
    <Stack gap="lg">
      <Heading level={1}>ChatThread</Heading>
      <Text color="secondary">
        A chat-bubble message thread with a typing indicator and a scroll-to-bottom affordance.
      </Text>

      <div style={{ height: 320, border: "1px solid var(--rebar-color-border)", borderRadius: 4 }}>
        <ChatThread messages={messages} />
      </div>
      <Button type="button" variant="secondary" onClick={addMessage} style={{ alignSelf: "flex-start" }}>
        + Add message
      </Button>

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
