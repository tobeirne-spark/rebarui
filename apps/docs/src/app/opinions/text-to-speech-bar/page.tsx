"use client";

import { useState } from "react";
import { Heading, Stack, Text, TextToSpeechBar } from "rebar-ui";
import type { TtsState } from "rebar-ui";
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
        code: '<TextToSpeechBar\n  state={state}\n  onGenerate={generate}\n  onPlay={play}\n  onPause={pause}\n  onStop={stop}\n/>',
      },
    ],
  },
  { type: "props-table", heading: "Props", rows: componentProps["TextToSpeechBar"] ?? [] },
  {
    type: "doc-section",
    heading: "Presentational — the caller drives real synthesis",
    body: [
      {
        kind: "text",
        text: "This component performs no speech synthesis itself; the caller (real browser SpeechSynthesis, a server call, or a local model) drives it via the `state` prop. The main button morphs per state, always a real ≥44px touch target, and an aria-live region announces every transition for non-visual users.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "data-rebar-* attributes",
    body: [
      {
        kind: "text",
        text: '`data-rebar-component="text-to-speech-bar"`, `data-rebar-state`; parts include `main-button`, `stop-button`, `voice-select`, and `speed-slider`.',
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Migrating to Ant Design",
    body: [
      {
        kind: "text",
        text: "Not codemod-covered — compose AntD's own `Button` + `Progress` + `Select` + `Slider` directly against the same state machine.",
      },
    ],
  },
];

export default function TextToSpeechBarPage() {
  const [state, setState] = useState<TtsState>("idle");

  return (
    <Stack gap="lg">
      <Heading level={1}>TextToSpeechBar</Heading>
      <Text color="secondary">
        A text-to-speech control bar with a real play/pause/stop/generate button cluster.
      </Text>

      <TextToSpeechBar
        state={state}
        onGenerate={() => {
          setState("generating");
          setTimeout(() => setState("playing"), 1200);
        }}
        onPlay={() => setState("playing")}
        onPause={() => setState("paused")}
        onStop={() => setState("idle")}
        voices={[{ id: "en-us", label: "English (US)" }, { id: "en-gb", label: "English (UK)" }]}
        selectedVoiceId="en-us"
      />

      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
