"use client";

import { useState } from "react";
import { Heading, Stack, Text, VoiceComposer } from "rebar-ui";
import type { VoiceComposerState } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import componentProps from "@/generated/component-props.json";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "Code",
    body: [
      {
        kind: "code",
        code: '<VoiceComposer\n  state={state}\n  draftText={draft}\n  onDraftTextChange={setDraft}\n  onStartRecording={start}\n  onStopRecording={stop}\n  onSend={send}\n  onCancel={cancel}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["VoiceComposer"] ?? [] },
  {
    type: "doc-section",
    heading: "Presentational — no MediaRecorder inside",
    body: [
      {
        kind: "text",
        text: "The caller owns real recording/transcription and drives this component via `state`/`draftText`, the same convention TextToSpeechBar/FileUpload/ChatThread already follow. The draft transcript is a real, editable textarea once ready — not read-only.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="voice-composer"`; parts include `main-button`, `cancel-button`, `draft-textarea`, and `elapsed-time`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Button` + `Input.TextArea` directly against the same state machine.",
      },
    ],
  },
];

export default function VoiceComposerPage() {
  const [state, setState] = useState<VoiceComposerState>("idle");
  const [draft, setDraft] = useState("");

  return (
    <Stack gap="lg">
      <Heading level={1}>VoiceComposer</Heading>
      <Text color="secondary">
        A voice-message composer — record/send button that morphs states, with a live-updating
        draft transcript.
      </Text>

      <VoiceComposer
        state={state}
        draftText={draft}
        onDraftTextChange={setDraft}
        onStartRecording={() => {
          setState("recording");
          setDraft("Listening…");
        }}
        onStopRecording={() => {
          setState("transcribing");
          setTimeout(() => {
            setDraft("This is the transcribed voice message.");
            setState("ready");
          }, 1000);
        }}
        onSend={() => {
          setState("idle");
          setDraft("");
        }}
        onCancel={() => {
          setState("idle");
          setDraft("");
        }}
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
