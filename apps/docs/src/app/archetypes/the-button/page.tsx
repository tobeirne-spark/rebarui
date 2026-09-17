import { Image, Stack } from "rebar-ui";
import type { Construct } from "@rebar-ui/placement";
import { NextBlockRenderer } from "@/components/NextBlockRenderer";

const BLOCKS: Construct[] = [
  {
    type: "doc-section",
    heading: "The Button",
    level: 1,
    body: [
      {
        kind: "text",
        text: "Every UI construct has an ancestor. Not a metaphor — an ancestor. The button didn't appear when someone drew a rectangle on a screen and decided it should be clickable. It appeared when someone first pushed a lever and watched a machine respond. The rectangle on the screen is the latest form in a lineage that stretches back through switches, levers, and the fundamental physics of mechanical advantage. And that lineage still shapes how the button works today — not as decoration, but as engineering.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The lever",
    body: [
      {
        kind: "text",
        text: "Start at the beginning. A lever is one of the six classical simple machines — a rigid bar pivoting around a fulcrum, trading distance for force. Push down on one end, the other end goes up. Archimedes described it around 260 BC, but it predates any description by millennia. Every human who has ever pried a rock loose with a stick understood the lever before it had a name.",
      },
      {
        kind: "text",
        text: "The lever's essential property is **mechanical advantage**: a small force applied over a large distance produces a large force over a small distance. This is not a UI concern. It is a physics concern. But it is the same physics that makes a button work — a small finger-press, amplified through a mechanism, producing a decisive state change in something much larger than your finger.",
      },
      {
        kind: "text",
        text: "Three things matter about the lever as an archetype: **input** (a deliberate, directed force), **transmission** (the mechanism that converts that force), and **output** (a clear, irreversible state change). Every button inherits this three-part structure, whether the transmission is a physical lever, an electrical switch, or a JavaScript event handler.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The switch",
    body: [
      {
        kind: "text",
        text: "The switch is the lever's first specialization for control. Where a lever moves things — lifts, pries, presses — a switch changes *states*. On or off. Connected or disconnected. The toggle switch, the rocker switch, the push-button switch: each one is a lever optimized for the binary decision. Small travel, definite endpoints, tactile confirmation at each extreme.",
      },
      {
        kind: "text",
        text: "The switch adds something the raw lever doesn't require: **state memory**. A lever returns to rest when you let go (a spring, gravity). A switch *stays*. The toggle stays up. The rocker stays down. The push-button clicks and holds. This is the origin of the digital concept of persistent state — the idea that an interaction doesn't just produce an effect, it produces a *condition* that endures until the next interaction.",
      },
      {
        kind: "text",
        text: "Notice what the switch also gives us: **bistability**. Two stable positions, with a clear transition between them. This is the physical prototype of the boolean. Every toggle in every UI is a physical switch's shadow — and the reason toggles feel intuitive is that everyone alive has operated a light switch before they've ever seen a screen.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The push-button",
    body: [
      {
        kind: "text",
        text: "The push-button is where the lineage narrows to the form we recognize. It collapses the lever's bar to a single point of contact — a surface you press with a fingertip. The mechanical advantage is hidden inside: a spring returns it, a snap-action mechanism gives it that crisp *click*, a contact bridge closes an electrical circuit. But the user's experience is pure input: press here, something happens.",
      },
      {
        kind: "text",
        text: "The push-button's critical innovation is **concentration of intent**. A lever's input surface is the whole bar — you can push anywhere along it, with varying force and direction. A button's input surface is one spot, one direction (down), one kind of action (press). This is not a loss — it's a gain. By removing every degree of freedom except *press or don't press*, the button makes the interaction unambiguous. The machine knows what you meant. You know what the machine will do.",
      },
      {
        kind: "text",
        text: "This is the design principle that survives the transition to screens: **reduce the input to a single unambiguous gesture, and the output becomes unambiguous too**. The digital button inherits this constraint. It has no position, no pressure sensitivity (usually), no direction. You tap it or you don't. And because the input is unambiguous, the system's response can be immediate and certain — the same certainty a physical button's click provides.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The digital button",
    body: [
      {
        kind: "text",
        text: "When a digital button appears on screen, it carries the entire lineage with it — whether its designer knows it or not. The raised rectangle is the push-button's surface. The hover state is the pre-press — the moment your finger commits before the click. The active/pressed state is the snap-action mechanism's threshold. The release and the resulting action are the contact closing. The whole sequence is a mechanical switch's travel curve, rendered in pixels instead of springs.",
      },
      {
        kind: "text",
        text: "This is why buttons that don't behave like buttons feel wrong. A button that doesn't respond on press but on release — technically a valid design choice — feels like a switch with a broken spring. A button with no pressed state feels like pushing a surface that doesn't move. A button that triggers on hover feels like a mechanism that fires before you've committed. Each violation is a violation of the *physical archetype*, not just a UI convention.",
      },
      {
        kind: "text",
        text: "This is also why the digital button can be almost infinitely restyled and still work. Change its color, its shape, its size, its label — it still reads as a button, because the archetype is not visual. The archetype is **temporal**: a sequence of *idle → committed → actuated → returned*. Get that sequence right and the button can look like anything. Get it wrong and no amount of visual polish will make it feel right.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "Design implications",
    body: [
      {
        kind: "text",
        text: "What does this lineage mean for someone building digital interfaces? Three things:",
      },
      {
        kind: "text",
        text: "**1. The press sequence is sacred.** The lever's travel, the switch's snap, the push-button's click — these are not optional feedback. They are the mechanism's identity. A digital button needs an unambiguous pressed state, an unambiguous release, and an unambiguous result. The timing between them is the feel. Too fast and it's twitchy. Too slow and it's sluggish. The right timing is the same timing a physical switch's snap-action mechanism has spent a century optimizing.",
      },
      {
        kind: "text",
        text: "**2. Bistability is a design choice, not a given.** Physical switches are bistable because their mechanism requires it — the toggle must be *somewhere*. Digital controls don't have this constraint. A button can be momentary (press to act, release to reset) or latching (press to toggle, press again to toggle back). Choosing correctly means asking: does this action produce a *state* or an *event*? States need latching. Events need momentary. Confusing them is the root of most toggle/switch misuse in UIs.",
      },
      {
        kind: "text",
        text: "**3. Concentration of intent is the button's real power.** The lever lets you push anywhere. The button lets you push *here*. This constraint is not a limitation — it's the reason buttons work at all. Every time you add a second action to a button, or make it context-sensitive, or give it a long-press behavior, you are *un-concentrating* the intent. Sometimes this is the right trade. But the cost is real: the user no longer knows what the button will do before they press it. The archetype is diluted.",
      },
    ],
  },
  {
    type: "doc-section",
    heading: "The archetype endures",
    body: [
      {
        kind: "text",
        text: "The button is not a rectangle on a screen. The button is the latest form of a lever — a simple machine that trades distance for force, concentrates intent to a single point, and produces a decisive state change. Every design decision about a digital button — its timing, its feedback, its bistability, its constraint — is a decision about how faithfully to reproduce the archetype, or how deliberately to depart from it.",
      },
      {
        kind: "text",
        text: "The archetype doesn't demand faithful reproduction. Digital buttons *should* depart from physical ones in some ways — they should be able to carry labels, to change meaning contextually, to be composed into sequences no physical button could manage. But the departures only work when the designer understands what they're departing *from*. A button that doesn't feel like a button isn't innovative. It's just broken in a way that a century of mechanical design had already solved.",
      },
      {
        kind: "text",
        text: "This is the pattern for every archetype in this series. The construct's name tells you its current form. Its archetype tells you why that form works — and what breaks when you forget where it came from.",
      },
    ],
  },
];

export default function TheButtonPage() {
  return (
    <Stack gap="lg">
      <Image src="/catalogue-heros/button.webp" alt="Button hero image" style={{ width: "100%", borderRadius: "8px" }} />
      <NextBlockRenderer blocks={BLOCKS} />
    </Stack>
  );
}
