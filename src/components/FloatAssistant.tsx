import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";
import { AssistantOrb } from "./AssistantOrb";

export interface FloatAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface FloatAssistantProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  /** Assistant name displayed in the header. */
  name?: string;
  /** Initial greeting message. */
  greeting?: string;
  /** Position of the floating button. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Accent color for the assistant. */
  accentColor?: string;
  /** Callback when user sends a message. */
  onSendMessage?: (message: string) => void;
  /** Callback when voice recording starts/stops. */
  onVoiceRecord?: (recording: boolean) => void;
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
  position = "bottom-right",
  accentColor = "var(--rebar-color-primary, #0066cc)",
  onSendMessage,
  onVoiceRecord,
  voiceEnabled = true,
  mode: controlledMode,
  onModeChange,
  draggable = true,
  minimizable = true,
  apiEndpoint,
  apiAuthToken,
  className,
  bionic,
  bionicOptions,
  ...props
}: FloatAssistantProps) {
  const id = useId();
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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animationFrameRef = useRef<number>(0);

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
  }, [dragState]);

  const handleDragEnd = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

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
    setInputValue("");
    onSendMessage?.(userText);
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
        } catch (error) {
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
    let right: string | number = "auto";
    let bottom: string | number = "auto";

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

  return (
    <div
      className={clsx("rebar-float-assistant", className)}
      data-rebar-component="float-assistant"
      style={{ position: "fixed", zIndex: 1500, pointerEvents: "none" }}
      {...props}
    >
      {/* Floating Button */}
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          "rebar-float-assistant-button",
          dragState.isDragging && "rebar-float-assistant-button-dragging",
          isMinimized && "rebar-float-assistant-button-minimized",
        )}
        data-rebar-part="trigger"
        aria-label={isOpen ? "Close assistant" : isMinimized ? "Expand assistant" : "Open assistant"}
        aria-expanded={isOpen}
        onClick={() => {
          if (isMinimized) {
            setIsMinimized(false);
            setIsOpen(true);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={
          {
            ...buttonStyle,
            "--assistant-accent": accentColor,
            pointerEvents: "auto",
            cursor: draggable ? (dragState.isDragging ? "grabbing" : "grab") : "pointer",
          } as unknown as React.CSSProperties
        }
      >
        {isMinimized ? (
          <div className="rebar-float-assistant-minimized-dot" />
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
              ...panelPosition,
              pointerEvents: "auto",
            } as unknown as React.CSSProperties
          }
        >
          {/* Header */}
          <div className="rebar-float-assistant-header">
            <div className="rebar-float-assistant-header-info">
              <div className="rebar-float-assistant-avatar">
                <div className="rebar-float-assistant-avatar-orb" />
              </div>
              <div>
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
                    <AssistantOrb
                      size={28}
                      color={accentColor}
                      isActive={false}
                      className="rebar-float-assistant-message-orb-canvas"
                    />
                  </div>
                )}
                <div className="rebar-float-assistant-message-content">
                  <div className="rebar-float-assistant-message-text">
                    {renderBionicChildren(msg.content, bionicEnabled, bionicOptions)}
                  </div>
                  <div className="rebar-float-assistant-message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="rebar-float-assistant-message rebar-float-assistant-message-assistant">
                <div className="rebar-float-assistant-message-avatar">
                  <AssistantOrb
                    size={28}
                    color={accentColor}
                    isActive={true}
                    className="rebar-float-assistant-message-orb-canvas"
                  />
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
                <input
                  ref={inputRef}
                  type="text"
                  className="rebar-float-assistant-input-field"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Message input"
                />
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
              <div className="rebar-float-assistant-voice-input">
                <button
                  type="button"
                  className={clsx("rebar-float-assistant-voice-btn", isRecording && "rebar-float-assistant-voice-btn-recording")}
                  onClick={toggleRecording}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? (
                    <div className="rebar-float-assistant-voice-waves">
                      <span className="rebar-float-assistant-voice-wave" />
                      <span className="rebar-float-assistant-voice-wave" />
                      <span className="rebar-float-assistant-voice-wave" />
                      <span className="rebar-float-assistant-voice-wave" />
                      <span className="rebar-float-assistant-voice-wave" />
                    </div>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
                {isRecording && <div className="rebar-float-assistant-recording-label">Listening...</div>}
              </div>
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
