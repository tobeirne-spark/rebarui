/**
 * Plain data constants for `FloatAssistant`, kept in their own file rather than exported directly
 * from `FloatAssistant.tsx` — `apps/docs/scripts/generate-props.mjs`'s react-docgen-typescript
 * pass treats every exported symbol in a scanned component file as component-shaped, so a plain
 * `export const X: string[] = [...]` there gets misidentified as a component needing its own
 * props table (already hit twice: `DEFAULT_FLOAT_ASSISTANT_VOICE_GREETINGS`, then
 * `DEFAULT_SCREENSHOT_ACKNOWLEDGMENT`). This file is never in `generate-props.mjs`'s scanned file
 * list, so it can't recur here no matter how many more of these constants get added later.
 */

/**
 * Spoken on long-press (voice mode activation) when `voiceGreetings` isn't supplied — deliberately
 * generic/unbranded, since this is the construct's own built-in default for real usage, not a
 * demo string. The docs site's own live demo passes its own branded set instead of relying on this.
 */
export const DEFAULT_FLOAT_ASSISTANT_VOICE_GREETINGS: string[] = [
  "Hi there! I'm listening — what can I help you with?",
  "Go ahead, I'm all ears.",
  "You've got my attention. What would you like to know?",
  "I'm ready when you are.",
  "Listening now — ask me anything.",
];

/** Shown as a real assistant message immediately after a successful screenshot capture, when
 * `screenshotAcknowledgment` isn't supplied. */
export const DEFAULT_SCREENSHOT_ACKNOWLEDGMENT =
  "Yep, I'm looking at the screen — what would you like me to analyze?";
