"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { pushToast, removeToast, type ToastType } from "@/components/ui/toast";

/**
 * "info" is the neutral message style. Calls without a variant use it, so
 * only real failures render as red error toasts.
 */
export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ShowToastOptions {
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults by variant (errors linger longer). */
  duration?: number;
  /** Keep the toast until the user dismisses it. */
  preserve?: boolean;
  /** Adds Dismiss + <action> buttons. */
  action?: string;
  onAction?: () => void;
  /** Adds an undo icon button. */
  onUndoAction?: () => void;
}

interface ToastContextValue {
  /** Shows a toast and returns its id (for dismissToast). */
  showToast: (message: string, options?: ShowToastOptions) => number;
  /** Convenience wrapper for the common case: showToast(message, { variant: "error" }). */
  showErrorToast: (message: string, options?: Omit<ShowToastOptions, "variant">) => number;
  dismissToast: (id: number) => void;
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  error: 6000,
  warning: 5000,
  success: 3500,
  info: 4000,
};

const TOAST_TYPE: Record<ToastVariant, ToastType> = {
  info: "message",
  success: "success",
  warning: "warning",
  error: "error",
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide toasts, mounted once in ClientProviders. Rendering lives in
 * components/ui/toast.tsx (Geist-style stacked toasts, bottom-right).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string, options: ShowToastOptions = {}) => {
    const variant = options.variant ?? "info";
    return pushToast(message, TOAST_TYPE[variant], {
      duration: options.duration ?? DEFAULT_DURATION[variant],
      preserve: options.preserve,
      action: options.action,
      onAction: options.onAction,
      onUndoAction: options.onUndoAction,
    });
  }, []);

  const showErrorToast = useCallback(
    (message: string, options?: Omit<ShowToastOptions, "variant">) =>
      showToast(message, { ...options, variant: "error" }),
    [showToast]
  );

  const dismissToast = useCallback((id: number) => removeToast(id), []);

  const value = useMemo(
    () => ({ showToast, showErrorToast, dismissToast }),
    [showToast, showErrorToast, dismissToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
