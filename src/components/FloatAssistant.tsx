import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";
import { renderMarkdown } from "../markdown";
import type { OrbInteractionState, OrbPersonaId } from "../orb-personas/personas";
import { ORB_PERSONAS } from "../orb-personas/personas";
import { AssistantOrb } from "./AssistantOrb";
import { VoiceInputBar } from "./VoiceInputBar";
import { Spin } from "./Spin";
import { AddIcon, AiAgentIcon, ScreenshotIcon } from "./icons-remix";
import { DEFAULT_FLOAT_ASSISTANT_VOICE_GREETINGS, DEFAULT_SCREENSHOT_ACKNOWLEDGMENT } from "./FloatAssistant.constants";

export interface FloatAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface FloatAssistantVoiceOption {
  id: string;
  label: string;
  /** Browser SpeechSynthesis voice name to match against, if using browser TTS. */
  browserVoiceName?: string;
  /** Qwen/Alibaba Cloud voice model ID for server-side TTS via the API endpoint. */
  cloudVoiceId?: string;
}

export interface FloatAssistantProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  /** Assistant name displayed in the header. */
  name?: string;
  /** Initial greeting message. */
  greeting?: string;
  /**
   * Spoken greeting options for voice mode, activated by long-pressing the trigger. One is picked
   * at random each time, so repeat activations don't feel robotic. Defaults to
   * `DEFAULT_FLOAT_ASSISTANT_VOICE_GREETINGS`, a generic set safe for real usage — pass your own
   * for a branded voice.
   */
  voiceGreetings?: string[];
  /** Position of the floating button. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Accent color for the assistant. */
  accentColor?: string;
  /**
   * Renders the trigger button's orb as one of the tuned WebGL personas
   * (`packages/core/src/orb-personas/*.md`: Spark, Strato, Chorus) instead of the lightweight
   * default 2D-canvas animation. When set, the orb also flies from the trigger and docks into the
   * panel header avatar when the panel opens, rather than the trigger and header each showing
   * their own separate, disconnected orb. Chat message avatars and the typing indicator always use
   * a static `AiAgentIcon` regardless — animating a full orb per chat message was distracting and
   * wasteful compute for repeated small instances.
   */
  persona?: OrbPersonaId;
  /**
   * Overrides the persona name shown in the panel header (next to/above `name`). Defaults to the
   * active persona's own label (e.g. "Strato"). Ignored when `persona` isn't set.
   */
  personaLabel?: string;
  /** Callback when user sends a message. `screenshot` (a data URL) is set when a screenshot was
   * captured since the last message (see `screenshotEnabled`); `pageContext` is the harvested key
   * terms from that same capture, only present when `contextAware` is also on. */
  onSendMessage?: (message: string, screenshot?: string, pageContext?: string[]) => void;
  /** Callback when voice recording starts/stops. */
  onVoiceRecord?: (recording: boolean) => void;
  /** The "+" button inside the text-input field. Omitted entirely (no button rendered) unless a
   * handler is passed — same "no dead control" stance as `VoiceInputBar`'s own camera button. */
  onAttachmentPress?: () => void;
  /** Shows a screenshot button in the panel header. Default true. */
  screenshotEnabled?: boolean;
  /**
   * Overrides how the screenshot is actually captured. The built-in default dynamically imports
   * `html2canvas` and renders the page's DOM into a canvas — no permission prompt, but it's an
   * approximation: it cannot see into cross-origin `<iframe>`s at all (a Power BI/Tableau/etc.
   * embed renders as a blank gap, not the report — a hard browser security boundary, not a bug),
   * and canvas/WebGL content elsewhere on the page may not capture correctly either. For real
   * pixel-perfect capture of that kind of content, provide a real screen-capture implementation
   * here instead (e.g. via `navigator.mediaDevices.getDisplayMedia`), accepting that browsers
   * require a native permission picker for that on every call. Must resolve to a data URL.
   */
  onCaptureScreenshot?: () => Promise<string>;
  /** The assistant message shown immediately after a successful capture — not a visible
   * attachment/thumbnail in the transcript, just an acknowledgment that sets up context for
   * whatever the user asks next; the actual image data rides along on the *next* `onSendMessage`/
   * `apiEndpoint` call instead. */
  screenshotAcknowledgment?: string;
  /**
   * When capturing a screenshot, also procedurally harvest a bounded list of key terms from the
   * page (title, heading text, visible button/link labels) — pure DOM reading, no LLM call, kept
   * deliberately small specifically to be cheap in tokens once it reaches a real model. Neither
   * the screenshot nor the harvested terms are sent to any third-party vision/AI service directly
   * from here (this construct never embeds real API keys client-side, same stance as
   * `apiEndpoint` above) — both just ride along on the *next* `onSendMessage`/`apiEndpoint` call,
   * for the developer's own server-side endpoint to do whatever real image/vision analysis it
   * wants with them. Default false.
   */
  contextAware?: boolean;
  /** Whether voice mode is enabled. */
  voiceEnabled?: boolean;
  /** Current interaction mode. */
  mode?: "text" | "voice";
  /** Callback when mode changes. */
  onModeChange?: (mode: "text" | "voice") => void;
  /** Whether the assistant can be dragged around the screen. */
  draggable?: boolean;
  /** Whether the assistant can be minimized to a small dot. */
  minimizable?: boolean;
  /**
   * Server-side API endpoint that proxies requests to the LLM/RAG service.
   * The app developer implements this endpoint to hold API keys securely
   * server-side. The construct never sees real API keys.
   *
   * Example endpoint contract:
   * POST /api/assistant/chat
   * Body: { message: string, history: FloatAssistantMessage[] }
   * Response: { reply: string }
   */
  apiEndpoint?: string;
  /** Optional auth token for the API endpoint (e.g., session token). */
  apiAuthToken?: string;
  /** Available voices for TTS. Pass a list to enable voice selection. */
  voices?: FloatAssistantVoiceOption[];
  /** Currently selected voice ID. */
  voiceId?: string;
  /** Callback when voice changes. */
  onVoiceChange?: (voiceId: string) => void;
  /** Visual theme — "light" (default) or "dark" (black panel background for demo/brand use). */
  theme?: "light" | "dark";
  /** Renders assistant message content as real Markdown (headings, lists, bold/italic/code,
   * links, fenced code blocks) via `renderMarkdown` — real LLM responses, Qwen/Claude included,
   * default to Markdown prose, same convention `ChatThread`'s own `markdown` prop already follows.
   * Default true; set false for a plain-text assistant that never emits Markdown syntax. */
  markdown?: boolean;
  className?: string;
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  velocityX: number;
  velocityY: number;
  lastMoveTime: number;
}

/**
 * A floating AI assistant button that expands into a chat/voice interface.
 * Features dynamic orb animations, voice and text input modes, drag-to-move
 * with physics, minimize to dot, and transparent AI interaction design.
 */
export function FloatAssistant({
  name = "Assistant",
  greeting = "Hi! How can I help you today?",
  voiceGreetings,
  position = "bottom-right",
  accentColor = "var(--rebar-color-primary, #0066cc)",
  persona,
  personaLabel,
  onSendMessage,
  onVoiceRecord,
  onAttachmentPress,
  screenshotEnabled = true,
  onCaptureScreenshot,
  screenshotAcknowledgment = DEFAULT_SCREENSHOT_ACKNOWLEDGMENT,
  contextAware = false,
  voiceEnabled = true,
  mode: controlledMode,
  onModeChange,
  draggable = true,
  minimizable = true,
  apiEndpoint,
  apiAuthToken,
  voices,
  voiceId,
  // Not yet wired to a call site — kept in the public prop type for the voice-picker UI this is
  // meant to drive once that lands, prefixed here only to satisfy the unused-var lint rule.
  onVoiceChange: _onVoiceChange,
  theme = "light",
  markdown = true,
  className,
  bionic,
  bionicOptions,
  ...props
}: FloatAssistantProps) {
  const ambientBionic = useAmbientBionic();
  const bionicEnabled = bionic ?? ambientBionic;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [internalMode, setInternalMode] = useState<"text" | "voice">("text");
  const [messages, setMessages] = useState<FloatAssistantMessage[]>([
    { id: "greeting", role: "assistant", content: greeting, timestamp: Date.now() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  // Holds the most recently captured screenshot until the *next* message send, at which point
  // it rides along on that call and is cleared — not rendered as a visible attachment/thumbnail
  // itself (see `screenshotAcknowledgment`'s own doc comment).
  const pendingScreenshotRef = useRef<string | null>(null);
  // Same "rides along on the next send" lifecycle as pendingScreenshotRef, only populated when
  // `contextAware` is on.
  const pendingPageContextRef = useRef<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressThreshold = 500; // ms
  const isLongPressRef = useRef(false);

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    velocityX: 0,
    velocityY: 0,
    lastMoveTime: 0,
  });
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null);

  const mode = controlledMode ?? internalMode;

  // Only the trigger button's orb reflects live interaction state — recording maps to
  // "listening", an in-flight reply maps to "thinking", everything else is "idle". There's no
  // "speaking" signal to derive yet (no TTS-playback state tracked here); a future voice-output
  // feature should set it once one exists, rather than this guessing at it now.
  const orbState: OrbInteractionState = isRecording ? "listening" : isTyping ? "thinking" : "idle";
  const activePersonaLabel = persona ? (personaLabel ?? ORB_PERSONAS[persona].label) : undefined;

  // Whether the trigger button is currently rendered "docked" into the panel's header — the whole
  // interactive button (not a decorative copy), so grabbing it while docked drags the whole panel,
  // exactly like grabbing a window's title bar. Deliberately not true while minimized: the
  // minimized dot has its own separate, much simpler affordance.
  const isDocked = Boolean(persona) && isOpen && !isMinimized;

  // Docked-window dragging — deliberately a separate, simpler mechanism from the closed trigger's
  // own drag/momentum system below (dragState/handleDragStart/handleDragMove/handleDragEnd, which
  // bounces off screen edges with velocity on release): sharing that state would mean gating every
  // one of those physics effects by mode instead of just leaving them untouched. A window being
  // dragged by its title bar tracks the pointer 1:1 and simply stops when released — no bounce.
  const [windowDragOffset, setWindowDragOffset] = useState({ x: 0, y: 0 });
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const windowDragStartRef = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number } | null>(
    null,
  );

  const handleWindowDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!draggable) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      windowDragStartRef.current = {
        mouseX: clientX,
        mouseY: clientY,
        offsetX: windowDragOffset.x,
        offsetY: windowDragOffset.y,
      };
      setIsWindowDragging(true);
    },
    [draggable, windowDragOffset],
  );

  const handleWindowDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const start = windowDragStartRef.current;
    if (!start) return;
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
    setWindowDragOffset({ x: start.offsetX + (clientX - start.mouseX), y: start.offsetY + (clientY - start.mouseY) });
  }, []);

  const handleWindowDragEnd = useCallback(() => {
    windowDragStartRef.current = null;
    setIsWindowDragging(false);
  }, []);

  useEffect(() => {
    if (!isWindowDragging) return;
    window.addEventListener("mousemove", handleWindowDragMove);
    window.addEventListener("mouseup", handleWindowDragEnd);
    window.addEventListener("touchmove", handleWindowDragMove);
    window.addEventListener("touchend", handleWindowDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleWindowDragMove);
      window.removeEventListener("mouseup", handleWindowDragEnd);
      window.removeEventListener("touchmove", handleWindowDragMove);
      window.removeEventListener("touchend", handleWindowDragEnd);
    };
  }, [isWindowDragging, handleWindowDragMove, handleWindowDragEnd]);

  // Starts fresh each time the assistant re-opens rather than accumulating drift indefinitely —
  // it reappears at its normal computed position next time, not wherever it was last dragged to.
  useEffect(() => {
    if (!isOpen) setWindowDragOffset({ x: 0, y: 0 });
  }, [isOpen]);

  const positionStyles = {
    "bottom-right": { bottom: 24, right: 24 },
    "bottom-left": { bottom: 24, left: 24 },
    "top-right": { top: 24, right: 24 },
    "top-left": { top: 24, left: 24 },
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Physics animation for drag momentum
  useEffect(() => {
    if (!dragState.isDragging && (Math.abs(dragState.velocityX) > 0.5 || Math.abs(dragState.velocityY) > 0.5)) {
      const animate = () => {
        setDragState((prev) => {
          const friction = 0.92;
          const bounce = 0.6;
          const newVelocityX = prev.velocityX * friction;
          const newVelocityY = prev.velocityY * friction;
          let newX = prev.currentX + newVelocityX;
          let newY = prev.currentY + newVelocityY;

          // Boundary checks — screen edges are walls with bounce
          const maxX = window.innerWidth - 56;
          const maxY = window.innerHeight - 56;
          
          let finalVelocityX = newVelocityX;
          let finalVelocityY = newVelocityY;

          if (newX < 0) {
            newX = 0;
            finalVelocityX = Math.abs(newVelocityX) * bounce;
          } else if (newX > maxX) {
            newX = maxX;
            finalVelocityX = -Math.abs(newVelocityX) * bounce;
          }

          if (newY < 0) {
            newY = 0;
            finalVelocityY = Math.abs(newVelocityY) * bounce;
          } else if (newY > maxY) {
            newY = maxY;
            finalVelocityY = -Math.abs(newVelocityY) * bounce;
          }

          // Hard clamp when velocity dies
          newX = Math.max(0, Math.min(maxX, newX));
          newY = Math.max(0, Math.min(maxY, newY));

          if (Math.abs(finalVelocityX) < 0.5 && Math.abs(finalVelocityY) < 0.5) {
            setButtonPosition({ x: newX, y: newY });
            return { ...prev, velocityX: 0, velocityY: 0, currentX: newX, currentY: newY };
          }

          setButtonPosition({ x: newX, y: newY });
          return {
            ...prev,
            currentX: newX,
            currentY: newY,
            velocityX: finalVelocityX,
            velocityY: finalVelocityY,
          };
        });
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [dragState.isDragging, dragState.velocityX, dragState.velocityY]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!draggable) return;
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    
    // Get current button position from DOM if not already tracked
    let startX = buttonPosition?.x ?? 0;
    let startY = buttonPosition?.y ?? 0;
    
    if (!buttonPosition && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startX = rect.left;
      startY = rect.top;
    }
    
    setDragState({
      isDragging: true,
      startX: clientX,
      startY: clientY,
      currentX: startX,
      currentY: startY,
      velocityX: 0,
      velocityY: 0,
      lastMoveTime: Date.now(),
    });
  }, [draggable, buttonPosition]);

  const handleDragEnd = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Long press → speech mode (must be before handleDragMove which references cancelLongPressTimer)
  const cancelLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  const startLongPressTimer = useCallback(() => {
    isLongPressRef.current = false;
    cancelLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Open panel, switch to voice mode, and speak greeting
      setIsOpen(true);
      setIsMinimized(false);
      setInternalMode("voice");
      onModeChange?.("voice");

      const greetingOptions =
        voiceGreetings && voiceGreetings.length > 0 ? voiceGreetings : DEFAULT_FLOAT_ASSISTANT_VOICE_GREETINGS;
      const greetingText = greetingOptions[Math.floor(Math.random() * greetingOptions.length)]!;

      // Find the selected voice config
      const selectedVoice = voiceId && voices ? voices.find((v) => v.id === voiceId) : undefined;

      // If cloud voice is configured and API endpoint exists, use server-side TTS
      if (selectedVoice?.cloudVoiceId && apiEndpoint) {
        // Send to server for cloud TTS (Qwen/Alibaba Cloud AI)
        fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiAuthToken ? { Authorization: `Bearer ${apiAuthToken}` } : {}),
          },
          body: JSON.stringify({
            type: "tts",
            text: greetingText,
            voiceId: selectedVoice.cloudVoiceId,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.audioUrl) {
              const audio = new Audio(data.audioUrl);
              audio.play();
            }
          })
          .catch(() => {
            // Fallback to browser TTS if server TTS fails
            speakWithBrowser(greetingText, selectedVoice);
          });
      } else {
        // Use browser SpeechSynthesis
        speakWithBrowser(greetingText, selectedVoice);
      }
    }, longPressThreshold);
  }, [onModeChange, cancelLongPressTimer, voiceId, voices, apiEndpoint, apiAuthToken, voiceGreetings]);

  // Helper to speak using browser SpeechSynthesis
  const speakWithBrowser = useCallback((text: string, voice?: FloatAssistantVoiceOption) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (voice?.browserVoiceName) {
        const browserVoices = window.speechSynthesis.getVoices();
        const matchedVoice = browserVoices.find((v) => v.name === voice.browserVoiceName);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleOrbPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    startLongPressTimer();
    handleDragStart(e);
  }, [startLongPressTimer, handleDragStart]);

  const handleOrbPointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    cancelLongPressTimer();
    handleDragEnd();

    // If it was a long press, don't trigger click (open/close)
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, [cancelLongPressTimer, handleDragEnd]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging) return;
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
    const now = Date.now();
    const deltaTime = now - dragState.lastMoveTime;
    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;
    const velocityX = deltaTime > 0 ? (deltaX / deltaTime) * 16 : 0;
    const velocityY = deltaTime > 0 ? (deltaY / deltaTime) * 16 : 0;

    // Cancel long press if user has moved significantly (it's a drag, not a long press)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      cancelLongPressTimer();
    }

    let newX = dragState.currentX + deltaX;
    let newY = dragState.currentY + deltaY;

    // Clamp to viewport during drag
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));

    setDragState((prev) => ({
      ...prev,
      currentX: newX,
      currentY: newY,
      startX: clientX,
      startY: clientY,
      velocityX,
      velocityY,
      lastMoveTime: now,
    }));
    setButtonPosition({ x: newX, y: newY });
  }, [dragState, cancelLongPressTimer]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    const userMessage: FloatAssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const userText = inputValue.trim();
    const screenshot = pendingScreenshotRef.current ?? undefined;
    const pageContext = pendingPageContextRef.current ?? undefined;
    pendingScreenshotRef.current = null;
    pendingPageContextRef.current = null;
    setInputValue("");
    onSendMessage?.(userText, screenshot, pageContext);
    setIsTyping(true);

    // Call the server-side proxy endpoint
    if (apiEndpoint) {
      const callApi = async () => {
        try {
          const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiAuthToken ? { Authorization: `Bearer ${apiAuthToken}` } : {}),
            },
            body: JSON.stringify({
              message: userText,
              history: messages.map((m) => ({ role: m.role, content: m.content })),
              ...(screenshot ? { screenshot } : {}),
              ...(pageContext ? { pageContext } : {}),
            }),
          });
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          const data = await response.json();
          setIsTyping(false);
          const assistantMessage: FloatAssistantMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply || data.response || data.message || "I received your message.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch {
          setIsTyping(false);
          const errorMessage: FloatAssistantMessage = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      };
      callApi();
    } else {
      // Fallback simulation when no API endpoint is configured
      setTimeout(() => {
        setIsTyping(false);
        const assistantMessage: FloatAssistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I'm processing your request...",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 1500);
    }
  }, [inputValue, onSendMessage, apiEndpoint, apiAuthToken, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Purely procedural — a bounded DOM read, zero LLM calls, deliberately small (60 terms, each
  // capped in length) specifically to stay cheap once this reaches a real model. Skips anything
  // inside the assistant's own root, same as the screenshot capture itself.
  const harvestPageKeyTerms = useCallback((): string[] => {
    if (typeof document === "undefined") return [];
    const terms = new Set<string>();
    const add = (text: string | null | undefined) => {
      const trimmed = text?.trim().replace(/\s+/g, " ");
      if (trimmed && trimmed.length > 1 && trimmed.length < 80) terms.add(trimmed);
    };
    add(document.title);
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
      if (rootRef.current?.contains(el)) return;
      add(el.textContent);
    });
    document.querySelectorAll("button, a[href], [role='button']").forEach((el) => {
      if (rootRef.current?.contains(el)) return;
      add(el.getAttribute("aria-label") || el.textContent);
    });
    return Array.from(terms).slice(0, 60);
  }, []);

  const captureScreenshot = useCallback(async () => {
    if (isCapturingScreenshot) return;
    setIsCapturingScreenshot(true);
    try {
      // Harvested unconditionally, independent of whether the visual capture below succeeds --
      // pure DOM reading, never touches html2canvas, so a page whose CSS html2canvas's parser
      // can't handle (color-mix(), oklch(), and other CSS Color Module Level 4 syntax it predates
      // entirely -- rebar-ui's own stylesheet included) shouldn't also lose this.
      if (contextAware) {
        pendingPageContextRef.current = harvestPageKeyTerms();
      }
      let screenshotOk = true;
      try {
        if (onCaptureScreenshot) {
          pendingScreenshotRef.current = await onCaptureScreenshot();
        } else {
          // Dynamically imported — consumers who never enable/use the screenshot button never pay
          // for html2canvas, the same "lazy-loaded, external in the build" pattern as the orb-
          // persona shader's own `three` dependency (see orb-shader/createOrbRenderer.ts).
          const { default: html2canvas } = await import("html2canvas");
          const canvas = await html2canvas(document.body, {
            // Never capture the assistant's own button/panel — this is a screenshot of the rest
            // of the page, not of itself.
            ignoreElements: (el) => rootRef.current?.contains(el) ?? false,
          });
          pendingScreenshotRef.current = canvas.toDataURL("image/png");
        }
      } catch (err) {
        // Best-effort, not a scenario to let take down the whole capture -- logged for the
        // developer (a consumer whose page trips this reliably wants to know why, not just that
        // it happened), but the DOM-harvested context above is still real and worth keeping.
        console.error("FloatAssistant: screenshot capture failed", err);
        pendingScreenshotRef.current = null;
        screenshotOk = false;
      }
      if (!screenshotOk && !contextAware) {
        // Neither a screenshot nor any page context was actually captured -- say so, rather than
        // falsely acknowledging a capture that didn't happen.
        const errorMessage: FloatAssistantMessage = {
          id: `screenshot-error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't capture the screen just now.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
      const ackMessage: FloatAssistantMessage = {
        id: `screenshot-${Date.now()}`,
        role: "assistant",
        content: screenshotAcknowledgment,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, ackMessage]);
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, [isCapturingScreenshot, onCaptureScreenshot, screenshotAcknowledgment, contextAware, harvestPageKeyTerms]);

  const toggleRecording = useCallback(() => {
    const newRecording = !isRecording;
    setIsRecording(newRecording);
    onVoiceRecord?.(newRecording);
  }, [isRecording, onVoiceRecord]);

  const toggleMode = useCallback(() => {
    const newMode = mode === "text" ? "voice" : "text";
    setInternalMode(newMode);
    onModeChange?.(newMode);
  }, [mode, onModeChange]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // The trigger requires a genuine double-click from a mouse (single click is reserved for
  // drag-to-move) — but a native <button> fires a plain "click" event on Enter/Space, never
  // "dblclick", so listening for onDoubleClick alone would silently strand keyboard users with no
  // way to open the assistant at all. This same handler is wired to both onDoubleClick and an
  // explicit onKeyDown for Enter/Space, so keyboard activation stays single-press.
  const activateTrigger = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsOpen((prev) => !prev);
    }
  }, [isMinimized]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const buttonStyle = buttonPosition
    ? { left: buttonPosition.x, top: buttonPosition.y, right: "auto", bottom: "auto" }
    : positionStyles[position];

  // Calculate panel position - opens adjacent to orb, not opposite side
  const getPanelPosition = (): React.CSSProperties => {
    const panelWidth = 360;
    const panelHeight = 520;
    const margin = 16;
    const gap = 16;

    // Get orb position
    let orbX = 0;
    let orbY = 0;
    
    if (buttonPosition) {
      orbX = buttonPosition.x;
      orbY = buttonPosition.y;
    } else {
      // Use default position from CSS
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      
      if (position === "bottom-right") {
        orbX = viewportWidth - 80;
        orbY = viewportHeight - 80;
      } else if (position === "bottom-left") {
        orbX = 24;
        orbY = viewportHeight - 80;
      } else if (position === "top-right") {
        orbX = viewportWidth - 80;
        orbY = 24;
      } else {
        orbX = 24;
        orbY = 24;
      }
    }

    // Panel opens to the left of orb by default, or right if orb is on left side
    const orbCenterX = orbX + 28; // orb is 56px, center is at +28
    const orbCenterY = orbY + 28;
    
    let left: number | string;
    let top: number | string;
    const right: string | number = "auto";
    const bottom: string | number = "auto";

    // If orb is on right half, panel opens to the left
    if (orbCenterX > (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2) {
      left = orbX - panelWidth - gap;
      if (left < margin) left = margin;
    } else {
      // Orb is on left half, panel opens to the right
      left = orbX + 56 + gap;
    }

    // Vertically center panel with orb, but keep in viewport
    top = orbCenterY - panelHeight / 2;
    if (top < margin) top = margin;
    if (top + panelHeight > (typeof window !== 'undefined' ? window.innerHeight : 800) - margin) {
      top = (typeof window !== 'undefined' ? window.innerHeight : 800) - panelHeight - margin;
    }

    return { left, top, right, bottom, position: "fixed" };
  };

  const panelPosition = getPanelPosition();
  const panelLeft = typeof panelPosition.left === "number" ? panelPosition.left : 0;
  const panelTop = typeof panelPosition.top === "number" ? panelPosition.top : 0;

  // Matches `.rebar-float-assistant-header`'s own 16px padding and the avatar being the header
  // row's first element — a fixed constant, not a measurement, specifically so dragging (which
  // needs to recompute this on every pointer-move frame) never depends on a live
  // getBoundingClientRect() call.
  const DOCKED_HEADER_OFFSET = 16;
  // Matches the closed trigger's own 56px size exactly (up from an earlier, smaller 44px/36px —
  // feedback was that the orb kept reading as too small next to the persona showcase cards
  // elsewhere on the page) rather than a separate, smaller "avatar" size.
  const DOCKED_BUTTON_SIZE = 56;

  const effectivePanelPosition: React.CSSProperties = isDocked
    ? { ...panelPosition, left: panelLeft + windowDragOffset.x, top: panelTop + windowDragOffset.y }
    : panelPosition;

  const dockedButtonStyle: React.CSSProperties | null = isDocked
    ? {
        left: panelLeft + windowDragOffset.x + DOCKED_HEADER_OFFSET,
        top: panelTop + windowDragOffset.y + DOCKED_HEADER_OFFSET,
        right: "auto",
        bottom: "auto",
      }
    : null;

  const effectiveButtonSize = isDocked ? DOCKED_BUTTON_SIZE : 56;
  // Mirrors the momentum effect's own trigger condition above — released with enough velocity to
  // still be bouncing/decelerating toward a stop. That loop already re-renders left/top at ~60fps
  // directly from the physics, which is already smooth on its own; a competing CSS transition
  // here made every one of those frequent position updates restart a fresh 0.4s transition toward
  // a constantly-moving target, so the visual position could barely move during the flick at all
  // — then "caught up" in one jump the next time anything else re-rendered the button (e.g. a
  // click), since only *then* did the transition finally have a stable target to reach.
  const isMomentumActive = !dragState.isDragging && (Math.abs(dragState.velocityX) > 0.5 || Math.abs(dragState.velocityY) > 0.5);
  // Dragging or momentum (either mode) needs the button to track the pointer/physics with zero
  // lag; the "fly to dock" move triggered by isOpen/isMinimized changing needs to visibly animate
  // instead of snapping.
  const buttonPositionTransition =
    dragState.isDragging || isWindowDragging || isMomentumActive
      ? "none"
      : "left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)";

  return (
    <div
      ref={rootRef}
      className={clsx("rebar-float-assistant", className)}
      data-rebar-component="float-assistant"
      style={{ position: "fixed", zIndex: 1500, pointerEvents: "none" }}
      {...props}
    >
      {/* Floating Button — this is the whole interactive widget, not just a trigger: once docked
          (isDocked), it's the literal same element, just repositioned/resized to sit in the panel
          header, still fully draggable — grabbing it then drags the whole panel, like a window's
          title bar. */}
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          "rebar-float-assistant-button",
          (dragState.isDragging || isWindowDragging) && "rebar-float-assistant-button-dragging",
          isMinimized && "rebar-float-assistant-button-minimized",
          isDocked && "rebar-float-assistant-button-docked",
          theme === "dark" && "rebar-float-assistant-button-dark",
        )}
        data-rebar-part="trigger"
        aria-label={isOpen ? "Close assistant" : isMinimized ? "Expand assistant" : "Open assistant (double-click, or Enter)"}
        aria-expanded={isOpen}
        onDoubleClick={() => {
          // Only handle it if it wasn't a long press
          if (!isLongPressRef.current) activateTrigger();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activateTrigger();
          }
        }}
        onMouseDown={isDocked ? handleWindowDragStart : handleOrbPointerDown}
        onMouseUp={isDocked ? handleWindowDragEnd : handleOrbPointerUp}
        onMouseLeave={cancelLongPressTimer}
        onTouchStart={isDocked ? handleWindowDragStart : handleOrbPointerDown}
        onTouchEnd={isDocked ? handleWindowDragEnd : handleOrbPointerUp}
        style={
          {
            ...(dockedButtonStyle ?? buttonStyle),
            width: effectiveButtonSize,
            height: effectiveButtonSize,
            transition: buttonPositionTransition,
            "--assistant-accent": accentColor,
            pointerEvents: "auto",
            // The panel is a later DOM sibling, so without this it would paint over the button
            // (which needs to sit visibly on top of the panel's header once docked).
            zIndex: isDocked ? 1600 : undefined,
            cursor: draggable ? (dragState.isDragging || isWindowDragging ? "grabbing" : "grab") : "pointer",
          } as unknown as React.CSSProperties
        }
      >
        {isMinimized ? (
          <div className="rebar-float-assistant-minimized-dot" />
        ) : persona ? (
          <AssistantOrb size={effectiveButtonSize} persona={persona} state={orbState} />
        ) : (
          <AssistantOrb
            size={56}
            color={accentColor}
            isActive={isOpen || isRecording}
            className="rebar-float-assistant-orb-canvas"
          />
        )}
      </button>

      {/* Minimize button moved inside panel header */}

      {/* Expanded Panel */}
      {isOpen && !isMinimized && (
        <div
          className="rebar-float-assistant-panel"
          data-rebar-part="panel"
          role="dialog"
          aria-label={`${name} assistant`}
          style={
            {
              "--assistant-accent": accentColor,
              ...effectivePanelPosition,
              transition: isWindowDragging ? "none" : undefined,
              pointerEvents: "auto",
            } as unknown as React.CSSProperties
          }
        >
          {/* Header */}
          <div className="rebar-float-assistant-header">
            <div className="rebar-float-assistant-header-info">
              <div className="rebar-float-assistant-avatar" data-rebar-part="header-avatar">
                {/* When a persona is set, the real trigger button itself docks here (see the
                    button's own `isDocked` styling above) instead of this static pulsing dot —
                    this is just the reserved layout space it visually sits on top of. */}
                {!persona && <div className="rebar-float-assistant-avatar-orb" />}
              </div>
              <div>
                {activePersonaLabel && (
                  <div className="rebar-float-assistant-persona-label">{activePersonaLabel}</div>
                )}
                <div className="rebar-float-assistant-name">{renderBionicChildren(name, bionicEnabled, bionicOptions)}</div>
                <div className="rebar-float-assistant-status">
                  {isTyping ? (
                    <span className="rebar-float-assistant-status-typing">
                      <span className="rebar-float-assistant-typing-dot" />
                      <span className="rebar-float-assistant-typing-dot" />
                      <span className="rebar-float-assistant-typing-dot" />
                      Thinking...
                    </span>
                  ) : (
                    "Online"
                  )}
                </div>
              </div>
            </div>
            <div className="rebar-float-assistant-header-actions">
              {screenshotEnabled && (
                <button
                  type="button"
                  className="rebar-float-assistant-screenshot-btn"
                  onClick={captureScreenshot}
                  disabled={isCapturingScreenshot}
                  aria-label={isCapturingScreenshot ? "Capturing screenshot…" : "Capture a screenshot of the page"}
                  title="Capture a screenshot of the page"
                  data-rebar-part="screenshot-button"
                >
                  {isCapturingScreenshot ? <Spin size="sm" /> : <ScreenshotIcon size={16} />}
                </button>
              )}
              {voiceEnabled && (
                <button
                  type="button"
                  className={clsx("rebar-float-assistant-mode-btn", mode === "voice" && "rebar-float-assistant-mode-btn-active")}
                  onClick={toggleMode}
                  aria-label={`Switch to ${mode === "text" ? "voice" : "text"} mode`}
                  title={`Switch to ${mode === "text" ? "voice" : "text"} mode`}
                >
                  {mode === "text" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  )}
                </button>
              )}
              {minimizable && (
                <button
                  type="button"
                  className="rebar-float-assistant-minimize-btn"
                  onClick={toggleMinimize}
                  aria-label="Minimize assistant"
                  title="Minimize to corner"
                  style={{
                    "--assistant-accent": accentColor,
                    pointerEvents: "auto",
                  } as React.CSSProperties}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="rebar-float-assistant-messages" data-rebar-part="messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx("rebar-float-assistant-message", `rebar-float-assistant-message-${msg.role}`)}
                data-rebar-part={`message-${msg.role}`}
              >
                {msg.role === "assistant" && (
                  <div className="rebar-float-assistant-message-avatar">
                    <AiAgentIcon size={16} style={{ color: "#fff" }} />
                  </div>
                )}
                <div className="rebar-float-assistant-message-content">
                  <div className="rebar-float-assistant-message-text">
                    {markdown
                      ? renderMarkdown(msg.content, { bionic: bionicEnabled, bionicOptions })
                      : renderBionicChildren(msg.content, bionicEnabled, bionicOptions)}
                  </div>
                  <div className="rebar-float-assistant-message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="rebar-float-assistant-message rebar-float-assistant-message-assistant">
                <div className="rebar-float-assistant-message-avatar">
                  <AiAgentIcon size={16} style={{ color: "#fff" }} />
                </div>
                <div className="rebar-float-assistant-message-content">
                  <div className="rebar-float-assistant-typing-indicator">
                    <span className="rebar-float-assistant-typing-dot" />
                    <span className="rebar-float-assistant-typing-dot" />
                    <span className="rebar-float-assistant-typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="rebar-float-assistant-input" data-rebar-part="input">
            {mode === "text" ? (
              <div className="rebar-float-assistant-text-input">
                <div className="rebar-float-assistant-input-wrap">
                  <input
                    ref={inputRef}
                    type="text"
                    className={clsx(
                      "rebar-float-assistant-input-field",
                      onAttachmentPress && "rebar-float-assistant-input-field-with-attachment",
                    )}
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    aria-label="Message input"
                  />
                  {onAttachmentPress && (
                    <button
                      type="button"
                      className="rebar-float-assistant-attachment-btn"
                      onClick={onAttachmentPress}
                      aria-label="Add attachment"
                    >
                      <AddIcon size={18} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="rebar-float-assistant-send-btn"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            ) : (
              <VoiceInputBar
                state={isRecording ? "listening" : isTyping ? "processing" : "idle"}
                onMicPress={toggleRecording}
                onKeyboardToggle={toggleMode}
                showCamera={false}
                seed={name}
                accentColor={accentColor}
              />
            )}
          </div>

          {/* Footer */}
          <div className="rebar-float-assistant-footer">
            <span className="rebar-float-assistant-disclaimer">
              AI can make mistakes. Check important info.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
