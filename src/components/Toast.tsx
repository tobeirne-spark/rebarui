import * as RadixToast from "@radix-ui/react-toast";
import type { ReactNode } from "react";
import { useBionicChildren } from "../bionic";
import type { BionicOptions } from "../bionic";

/**
 * Mount once at the app root, wrapping everything — same pattern Radix itself documents.
 * Individual <Toast> components elsewhere in the tree render into this viewport via portal.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <RadixToast.Provider>
      {children}
      <RadixToast.Viewport className="rebar-toast-viewport" data-rebar-component="toast-viewport" />
    </RadixToast.Provider>
  );
}

export interface ToastProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  /** Force bionic reading on/off for the title/description, overriding the ambient data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  duration,
  bionic,
  bionicOptions,
}: ToastProps) {
  const titleContent = useBionicChildren(title, bionic, bionicOptions);
  const descriptionContent = useBionicChildren(description, bionic, bionicOptions);
  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className="rebar-toast"
      data-rebar-component="toast"
      data-rebar-type={type}
    >
      <RadixToast.Title className="rebar-toast-title" data-rebar-part="title">
        {titleContent}
      </RadixToast.Title>
      {description ? (
        <RadixToast.Description data-rebar-part="description">{descriptionContent}</RadixToast.Description>
      ) : null}
      <RadixToast.Close className="rebar-toast-close" data-rebar-part="close" aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
